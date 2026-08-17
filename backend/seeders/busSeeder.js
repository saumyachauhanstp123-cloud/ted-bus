const mongoose = require('mongoose');
require('dotenv').config();
const Bus = require('../models/bus.js');

const buses = [
  {
    busName: "TED Express",
    busNumber: "TED001",
    source: "Delhi",
    destination: "Lucknow",
    departureTime: "06:00 AM",
    arrivalTime: "02:00 PM",
    price: 799,
    totalSeats: 40,
    availableSeats: 32,
    bookedSeats: [],
    busType: "AC Seater"
  },
  {
    busName: "Royal Travels",
    busNumber: "ROY002",
    source: "Delhi",
    destination: "Jaipur",
    departureTime: "08:30 AM",
    arrivalTime: "02:30 PM",
    price: 650,
    totalSeats: 45,
    availableSeats: 38,
    bookedSeats: [],
    busType: "AC Sleeper"
  },
  {
    busName: "Volvo Multi Axle",
    busNumber: "VOL003",
    source: "Mumbai",
    destination: "Pune",
    departureTime: "10:00 AM",
    arrivalTime: "02:00 PM",
    price: 550,
    totalSeats: 35,
    availableSeats: 22,
    bookedSeats: ["A1","A2"],
    busType: "AC Seater"
  },
  {
    busName: "Shatabdi Travels",
    busNumber: "SHA004",
    source: "Bangalore",
    destination: "Chennai",
    departureTime: "07:00 AM",
    arrivalTime: "01:30 PM",
    price: 899,
    totalSeats: 38,
    availableSeats: 31,
    bookedSeats: [],
    busType: "AC Sleeper"
  },
  {
    busName: "TED Deluxe",
    busNumber: "TED005",
    source: "Agra",
    destination: "Delhi",
    departureTime: "05:30 PM",
    arrivalTime: "10:30 PM",
    price: 450,
    totalSeats: 42,
    availableSeats: 35,
    bookedSeats: [],
    busType: "Non-AC Seater"
  },
  {
    busName: "Kolkata Express",
    busNumber: "KOL006",
    source: "Kolkata",
    destination: "Patna",
    departureTime: "09:00 PM",
    arrivalTime: "06:00 AM",
    price: 750,
    totalSeats: 48,
    availableSeats: 41,
    bookedSeats: [],
    busType: "AC Sleeper"
  },
  {
    busName: "Hyderabad Volvo",
    busNumber: "HYD007",
    source: "Hyderabad",
    destination: "Vijayawada",
    departureTime: "06:00 AM",
    arrivalTime: "11:30 AM",
    price: 680,
    totalSeats: 36,
    availableSeats: 19,
    bookedSeats: ["B3","C2"],
    busType: "AC Seater"
  },
  {
    busName: "Gujarat Queen",
    busNumber: "GUJ008",
    source: "Ahmedabad",
    destination: "Surat",
    departureTime: "11:00 AM",
    arrivalTime: "03:00 PM",
    price: 420,
    totalSeats: 40,
    availableSeats: 37,
    bookedSeats: [],
    busType: "Non-AC Seater"
  },
  {
    busName: "TED Rajdhani",
    busNumber: "TED009",
    source: "Chandigarh",
    destination: "Delhi",
    departureTime: "07:00 PM",
    arrivalTime: "01:00 AM",
    price: 950,
    totalSeats: 32,
    availableSeats: 28,
    bookedSeats: [],
    busType: "AC Sleeper"
  },
  {
    busName: "Varanasi Express",
    busNumber: "VAR010",
    source: "Varanasi",
    destination: "Allahabad",
    departureTime: "04:00 AM",
    arrivalTime: "08:30 AM",
    price: 380,
    totalSeats: 44,
    availableSeats: 39,
    bookedSeats: [],
    busType: "Non-AC Seater"
  },
  {
    busName: "Coimbatore Queen",
    busNumber: "COI011",
    source: "Coimbatore",
    destination: "Chennai",
    departureTime: "09:30 PM",
    arrivalTime: "05:30 AM",
    price: 1200,
    totalSeats: 28,
    availableSeats: 15,
    bookedSeats: ["A1","A4","C2"],
    busType: "AC Sleeper"
  },
  {
    busName: "Goa Express",
    busNumber: "GOA012",
    source: "Pune",
    destination: "Goa",
    departureTime: "08:00 AM",
    arrivalTime: "04:00 PM",
    price: 850,
    totalSeats: 40,
    availableSeats: 33,
    bookedSeats: [],
    busType: "AC Seater"
  }
];

const seedBuses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    // Clear existing buses (optional - comment if you don't want to delete old data)
    // await Bus.deleteMany({});
    // console.log("🗑️ Old buses cleared");

    let added = 0;
    for (const busData of buses) {
      const exists = await Bus.findOne({ busNumber: busData.busNumber });
      if (!exists) {
        await Bus.create(busData);
        added++;
        console.log(`✅ Added: ${busData.busName} (${busData.busNumber})`);
      } else {
        console.log(`⚠️ Skipped (already exists): ${busData.busName}`);
      }
    }

    console.log(`\n🎉 Seeding Complete! ${added} new buses added.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Failed:", error.message);
    process.exit(1);
  }
};

seedBuses();