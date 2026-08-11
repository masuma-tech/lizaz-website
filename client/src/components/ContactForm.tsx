import { FormEvent, useState } from "react";
import { submitContact } from "@/lib/data";

const SERVICES = [
  "Business Formation & Trade Licensing",
  "Visa & Immigration Services",
  "PRO & Government Liaison",
  "Document Attestation & Legal Translation",
  "Corporate Support",
];

type Status = { type: "success" | "error"; message: string } | null;

export function ContactForm({ light = false }: { light?: boolean }) {
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      service: String(data.get("service") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.message || !payload.service) {
      setStatus({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    setSubmitting(true);
    try {
      await submitContact(payload);
      setStatus({
        type: "success",
        message: "Thank you. Your inquiry was submitted successfully.",
      });
      form.reset();
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again or email Info@lizaz.ae.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={`contact-form${light ? " contact-form--light" : ""}`} onSubmit={onSubmit} noValidate>
      <div className="contact-form__grid">
        <label className="contact-form__field">
          <span>First Name</span>
          <input type="text" name="firstName" placeholder="Enter your first name" required autoComplete="given-name" />
        </label>
        <label className="contact-form__field">
          <span>Last Name</span>
          <input type="text" name="lastName" placeholder="Enter your last name" required autoComplete="family-name" />
        </label>
        <label className="contact-form__field">
          <span>Email Address</span>
          <input type="email" name="email" placeholder="Enter your Email Address" required autoComplete="email" />
        </label>
        <label className="contact-form__field">
          <span>Phone No.</span>
          <input type="tel" name="phone" placeholder="Enter your Phone No." autoComplete="tel" />
        </label>
        <label className="contact-form__field contact-form__field--full">
          <span>Services</span>
          <select name="service" required defaultValue="">
            <option value="" disabled>
              Select A Service
            </option>
            {SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="contact-form__field contact-form__field--full">
        <span>Message</span>
        <textarea name="message" rows={4} placeholder="Enter Your Message Here" required />
      </label>
      {status && (
        <p
          className={`contact-form-status contact-form-status--${status.type}`}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      )}
      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit now"}
      </button>
    </form>
  );
}
