/* TODO: Wire contact form submission to backend support endpoint before launch */
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-semibold">
          <Mail className="w-4 h-4" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-primary">Contact Options</h1>
        <p className="text-base text-text-secondary max-w-lg mx-auto">
          Have a question about an order, seller application, or course? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
            <Mail className="w-5 h-5 text-primary" />
            <h4 className="font-heading font-bold text-base">Customer Support Email</h4>
            <p className="text-sm text-text-secondary">support@ecomarket.example.com</p>
          </div>

          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
            <Phone className="w-5 h-5 text-secondary" />
            <h4 className="font-heading font-bold text-base">Phone Helpline</h4>
            <p className="text-sm text-text-secondary">+91 1800-123-ECO (Toll-Free)</p>
          </div>

          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-3">
            <MapPin className="w-5 h-5 text-accent" />
            <h4 className="font-heading font-bold text-base">Headquarters</h4>
            <p className="text-sm text-text-secondary">Bengaluru, Karnataka, India</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-background-card rounded-2xl p-6 md:p-8 border border-text-muted/15 shadow-soft">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-xl font-bold font-heading">Message Sent!</h3>
              <p className="text-sm text-text-secondary">
                Thank you for reaching out. Our support team will get back to you within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold font-heading">Send Us a Message</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-soft"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
