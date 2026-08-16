// Localized notification templates (English + Hindi)

const templates = {
  BOOKING_CONFIRMED: {
    en: {
      title: "Booking Confirmed! ✅",
      message: (d) => `Your ticket for ${d.busName} from ${d.source} to ${d.destination} is confirmed. Seat: ${d.seat}. Journey: ${d.date}`,
    },
    hi: {
      title: "बुकिंग कन्फर्म! ✅",
      message: (d) => `${d.busName} (${d.source} से ${d.destination}) की आपकी टिकट कन्फर्म हो गई है। सीट: ${d.seat}। यात्रा: ${d.date}`,
    },
  },
  BOOKING_CANCELLED: {
    en: {
      title: "Booking Cancelled ❌",
      message: (d) => `Your booking for seat ${d.seat} has been cancelled. Refund will be processed within 3-5 days.`,
    },
    hi: {
      title: "बुकिंग रद्द ❌",
      message: (d) => `सीट ${d.seat} की आपकी बुकिंग रद्द कर दी गई है। रिफंड 3-5 दिनों में प्रोसेस होगा।`,
    },
  },
  SCHEDULE_CHANGE: {
    en: {
      title: "Schedule Changed ⏰",
      message: (d) => `Departure time for ${d.busName} has changed to ${d.newTime}. Please plan accordingly.`,
    },
    hi: {
      title: "समय में बदलाव ⏰",
      message: (d) => `${d.busName} का प्रस्थान समय बदलकर ${d.newTime} हो गया है। कृपया उसी अनुसार योजना बनाएं।`,
    },
  },
  JOURNEY_REMINDER: {
    en: {
      title: "Journey Reminder 🚌",
      message: (d) => `Reminder: Your journey from ${d.source} to ${d.destination} is tomorrow at ${d.time}. Seat: ${d.seat}`,
    },
    hi: {
      title: "यात्रा रिमाइंडर 🚌",
      message: (d) => `रिमाइंडर: ${d.source} से ${d.destination} की आपकी यात्रा कल ${d.time} बजे है। सीट: ${d.seat}`,
    },
  },
  PROMOTION: {
    en: {
      title: "Special Offer! 🎉",
      message: (d) => d.text || "Check out our latest offers and save on your next journey!",
    },
    hi: {
      title: "खास ऑफर! 🎉",
      message: (d) => d.textHi || "हमारे नए ऑफर देखें और अपनी अगली यात्रा पर बचत करें!",
    },
  },
};

function getTemplate(key, language = "en", data = {}) {
  const template = templates[key];
  if (!template) return { title: key, message: "" };

  const localized = template[language] || template.en;
  return {
    title: localized.title,
    message: localized.message(data),
  };
}

module.exports = { getTemplate };