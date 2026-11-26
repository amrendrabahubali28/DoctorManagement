import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { getDoctorDocuments, getDoctorData } from "./docFormat.js";

const INDEX_FILE = "faiss.index"; // file FaissStore.save() writes inside the directory

/**
 * FAISS-backed vector store of doctors.
 *
 * - Each doctor's Mongo `_id` is used as the docstore id AND stored in metadata (`_id`).
 * - An in-memory Map (_id -> content hash) gives O(1) existence checks and lets
 *   upsert skip the (paid) embedding call + disk write when nothing changed.
 * - Mutations are serialized through a promise queue so concurrent calls never
 *   corrupt the index or race on disk writes.
 *
 * `filePath` is a directory: FaissStore persists `faiss.index` + `docstore.json` in it.
 */
export class DoctorStore {
  #doctors;
  #filePath;
  #embeddings;
  #hashKey;
  #store = null;
  #hashes = new Map(); // _id -> content hash
  #ready = null;
  #queue = Promise.resolve();

  /**
   * @param {object[]} doctors  Doctors as returned by the mongoose model (used only if no saved store exists)
   * @param {string} filePath   Directory where the index is persisted
   * @param {{ embeddings?: object, hashKey?: string }} [options]
   */
  constructor(doctors, filePath, options = {}) {
    if (!filePath || typeof filePath !== "string") {
      throw new TypeError("filePath must be a non-empty string");
    }
    this.#doctors = doctors ?? [];
    this.#filePath = filePath;
    this.#embeddings =
      options.embeddings ??
      new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-001" });
    this.#hashKey = options.hashKey ?? "doctor-store";
  }

  /** Convenience: construct and fully initialise. */
  static async create(doctors, filePath, options) {
    const store = new DoctorStore(doctors, filePath, options);
    await store.init();
    return store;
  }

  /** Idempotent, lazy initialisation (also invoked automatically by every method). */
  init() {
    return (this.#ready ??= this.#init());
  }

  /** Underlying FaissStore, e.g. for `similaritySearch` / `asRetriever`. */
  async getStore() {
    await this.init();
    return this.#store;
  }

  /** Is this doctor id in the index? (in-memory, no disk access) */
  async has(id) {
    await this.init();
    return this.#hashes.has(String(id));
  }

  /** Insert or update a doctor. Returns "created" | "updated" | "unchanged". */
  upsert(doctor, { persist = true } = {}) {
    return this.#enqueue(async () => {
      await this.init();
      const { id, plain } = DoctorStore.#normalize(doctor);
      const text = getDoctorData(plain);
      const hash = this.#hash(text);
      const previous = this.#hashes.get(id);

      if (previous === hash) return "unchanged"; // no embedding call, no disk write

      const document = DoctorStore.#toDocument(text, id, hash);

      // Embed first so a failed API call leaves the old entry untouched.
      const vectors = await this.#embeddings.embedDocuments([text]);

      if (previous !== undefined) {
        await this.#store.delete({ ids: [id] }); // FAISS has no in-place update
      }
      await this.#store.addVectors(vectors, [document], { ids: [id] });
      this.#hashes.set(id, hash);

      if (persist) await this.#save();
      return previous === undefined ? "created" : "updated";
    });
  }

  /** Remove a doctor (by doctor object or raw id). Returns true if something was removed. */
  delete(doctorOrId, { persist = true } = {}) {
    return this.#enqueue(async () => {
      await this.init();
      const id = DoctorStore.#extractId(doctorOrId);
      if (!this.#hashes.has(id)) return false; // O(1) miss, no FAISS/disk work

      await this.#store.delete({ ids: [id] });
      this.#hashes.delete(id);

      if (persist) await this.#save();
      return true;
    });
  }

  /** Flush to disk (use after batching with `{ persist: false }`). */
  save() {
    return this.#enqueue(async () => {
      await this.init();
      await this.#save();
    });
  }

  // ---------------------------------------------------------------- internals

  async #init() {
    if (existsSync(join(this.#filePath, INDEX_FILE))) {
      this.#store = await FaissStore.load(this.#filePath, this.#embeddings);
      // Rebuild the id -> hash lookup from the in-memory docstore (one-time, no extra disk reads).
      for (const id of Object.values(this.#store._mapping)) {
        const doc = this.#store.docstore.search(id);
        this.#hashes.set(id, typeof doc === "string" ? null : doc.metadata?.hash ?? null);
      }
      return;
    }

    this.#store = new FaissStore(this.#embeddings, {});

    // Dedupe by _id (last one wins) so ids stay unique in the index.
    const byId = new Map();
    for (const doctor of this.#doctors) {
      byId.set(DoctorStore.#normalize(doctor).id, doctor);
    }
    const unique = [...byId.values()];
    if (unique.length === 0) return; // FAISS index is created lazily on first insert

    const documents = getDoctorDocuments(unique).map((doc, i) => {
      const id = DoctorStore.#normalize(unique[i]).id;
      const hash = this.#hash(doc.pageContent);
      this.#hashes.set(id, hash);
      return DoctorStore.#toDocument(doc.pageContent, id, hash);
    });

    // Single batched embedding call for all doctors.
    await this.#store.addDocuments(documents, { ids: [...byId.keys()] });
    await this.#save();
  }

  async #save() {
    if (!this.#store._index) return; // nothing was ever indexed
    await this.#store.save(this.#filePath); // creates the directory if missing
  }

  #enqueue(task) {
    const run = this.#queue.then(task);
    this.#queue = run.catch(() => {}); // keep the chain alive after failures
    return run;
  }

  #hash(text) {
    return createHmac("sha256", this.#hashKey).update(text).digest("hex");
  }

  static #toDocument(pageContent, id, hash) {
    // Reuse the shape produced by getDoctorDocuments, then attach metadata.
    const [doc] = getDoctorDocuments([{}]);
    doc.pageContent = pageContent;
    doc.metadata = { _id: id, hash };
    return doc;
  }

  static #normalize(doctor) {
    const plain =
      doctor && typeof doctor.toObject === "function" ? doctor.toObject() : doctor;
    if (!plain || typeof plain !== "object" || plain._id == null) {
      throw new TypeError("Doctor must be an object with an _id");
    }
    return { id: String(plain._id), plain };
  }

  static #extractId(doctorOrId) {
    if (doctorOrId && typeof doctorOrId === "object" && "_id" in doctorOrId) {
      return String(doctorOrId._id);
    }
    return String(doctorOrId);
  }
}

export default DoctorStore;