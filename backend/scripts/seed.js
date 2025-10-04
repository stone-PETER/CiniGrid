import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Sample users data
    const users = [
      {
        username: 'producer_john',
        password: 'password123',
        role: 'producer'
      },
      {
        username: 'scout_sara',
        password: 'password123',
        role: 'scout'
      },
      {
        username: 'director_mike',
        password: 'password123',
        role: 'director'
      },
      {
        username: 'manager_lisa',
        password: 'password123',
        role: 'manager'
      }
    ];

    // Hash passwords and create users
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = new User({
        username: userData.username,
        password: hashedPassword,
        role: userData.role
      });

      await user.save();
      console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    console.log('🎉 Seed data created successfully!');
    console.log('\n📋 Sample Users Created:');
    console.log('Username: producer_john | Password: password123 | Role: producer');
    console.log('Username: scout_sara | Password: password123 | Role: scout');
    console.log('Username: director_mike | Password: password123 | Role: director');
    console.log('Username: manager_lisa | Password: password123 | Role: manager');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seed function
seedUsers();