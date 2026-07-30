import { connectDB } from '../config/db';
import User from '../models/User';
import Business from '../models/Business';
import Product from '../models/Product';
import PlatformConfig from '../models/PlatformConfig';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();
  await PlatformConfig.getSingleton();

  const existingAdmin = await User.findOne({ email: 'admin@plantpanda.com' });
  if (!existingAdmin) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@plantpanda.com',
      phone: '03000000000',
      password: 'admin1234',
      role: 'super_admin',
      isApproved: true,
    });
    console.log('Created super admin: admin@plantpanda.com / admin1234');
  }

  let nurseryUser = await User.findOne({ email: 'nursery@plantpanda.com' });
  if (!nurseryUser) {
    nurseryUser = await User.create({
      name: 'Green Leaf Nursery Owner',
      email: 'nursery@plantpanda.com',
      phone: '03001111111',
      password: 'nursery1234',
      role: 'nursery',
      isApproved: true,
    });

    const business = await Business.create({
      userId: nurseryUser._id,
      name: 'Green Leaf Nursery',
      type: 'nursery',
      address: 'Susan Road, Faisalabad',
      location: { type: 'Point', coordinates: [73.0839, 31.4227] },
      commissionRate: 10,
      status: 'approved',
    });

    await Product.create([
      {
        businessId: business._id,
        name: 'Money Plant (Pothos)',
        description: 'Easy-care indoor plant, great air purifier.',
        price: 450,
        stock: 50,
        category: 'indoor',
        images: [],
      },
      {
        businessId: business._id,
        name: 'Snake Plant',
        description: 'Low maintenance, thrives in low light.',
        price: 650,
        stock: 30,
        category: 'indoor',
        images: [],
      },
      {
        businessId: business._id,
        name: 'Rose Plant (Potted)',
        description: 'Fragrant blooming rose in a ceramic pot.',
        price: 900,
        stock: 20,
        category: 'outdoor',
        images: [],
      },
    ]);
    console.log('Created sample nursery + products: nursery@plantpanda.com / nursery1234');
  }

  let riderUser = await User.findOne({ email: 'rider@plantpanda.com' });
  if (!riderUser) {
    riderUser = await User.create({
      name: 'Ali Rider',
      email: 'rider@plantpanda.com',
      phone: '03002222222',
      password: 'rider1234',
      role: 'rider',
      isApproved: true,
      vehicleType: 'bike',
      vehicleNumber: 'FSD-1234',
    });
    console.log('Created sample rider: rider@plantpanda.com / rider1234');
  }

  let customerUser = await User.findOne({ email: 'customer@plantpanda.com' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Sara Customer',
      email: 'customer@plantpanda.com',
      phone: '03003333333',
      password: 'customer1234',
      role: 'customer',
      isApproved: true,
    });
    console.log('Created sample customer: customer@plantpanda.com / customer1234');
  }

  await User.updateMany({ role: { $in: ['nursery', 'branch', 'rider'] } }, { isApproved: true });
  console.log('Approved all nursery and rider accounts.');

  console.log('Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
