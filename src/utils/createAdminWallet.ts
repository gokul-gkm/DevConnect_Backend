import mongoose, { connect } from 'mongoose';
import { WalletRepository } from '@/infrastructure/repositories/WalletRepository'

async function createAdminWallet() {
  try {
    await connect(process.env.MONGODB_URL!);
    
    const walletRepository = new WalletRepository();

    const adminWallet = await walletRepository.findByAdminId(process.env.ADMIN_ID!);
    
    if (!adminWallet) {
      await walletRepository.createAdminWallet();
      console.log('Admin wallet created successfully');
    } else {
      console.log('Admin wallet already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminWallet();