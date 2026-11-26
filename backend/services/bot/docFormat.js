import { Document } from "@langchain/core/documents";

function getDoctorData(doctor) {
  if (!doctor || typeof doctor !== "object" || Array.isArray(doctor)) {
    throw new TypeError("Doctor data must be a doctor object");
  }

  const slots = [];
  if (Array.isArray(doctor.availableSlots)) {
    for (const slot of doctor.availableSlots) {
      slots.push(
        typeof slot === "string"
          ? `- ${slot}`
          : `- ${slot.date}: ${slot.time}`
      );
    }
  }
  const availableSlots = slots.length ? slots.join("\n") : "- None listed";

  return `## ${doctor.name ?? "Not provided"}
- About: ${doctor.about ?? "Not provided"}
- Degree: ${doctor.degree ?? "Not provided"}
- Experience: ${doctor.experience ?? "Not provided"}
- Fees: ${doctor.fees ?? "Not provided"}
- Available slots:
${availableSlots}`;
}

function getDoctorDocuments(doctors) {
  if (!Array.isArray(doctors)) {
    throw new TypeError("Doctors data must be an array");
  }

  const documents = [];
  for (const doctor of doctors) {
    documents.push(
      new Document({
        pageContent: getDoctorData(doctor),
      })
    );
  }

  return documents;
}

export { getDoctorData, getDoctorDocuments };
export default getDoctorDocuments;
