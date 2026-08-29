/* eslint-disable no-console */
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, IPO, MoneyTransaction } from '../src/models';
import { rupeesToPaise } from '../src/utils/money';

async function seed(): Promise<void> {
  console.log('Connecting to database...');
  await connectDatabase();

  console.log('Seeding users...');
  await User.deleteMany({});
  await User.insertMany([
    { name: 'Deepak', isActive: true },
    { name: 'Aman', isActive: true },
  ]);

  console.log('Seeding IPOs...');
  await IPO.deleteMany({});
  await IPO.insertMany([
    {
      ipoName: 'ABC Technologies IPO',
      companyName: 'ABC Technologies Ltd',
      appliedDate: new Date('2025-01-10'),
      dematName: 'Nanesh',
      applicationAmount: rupeesToPaise(60000),
      lotSize: 40,
      lotsApplied: 2,
      sharesApplied: 80,
      applicationPrice: rupeesToPaise(150),
      status: 'ALLOTTED',
      allottedShares: 200,
      allotmentPrice: rupeesToPaise(150),
      listingDate: new Date('2025-01-22'),
      listingPrice: rupeesToPaise(220),
      currentPrice: rupeesToPaise(235),
      notes: 'Strong listing gains',
      createdBy: 'Deepak',
    },
    {
      ipoName: 'XYZ Industries IPO',
      companyName: 'XYZ Industries Ltd',
      appliedDate: new Date('2025-02-05'),
      dematName: 'Aman',
      applicationAmount: rupeesToPaise(45000),
      lotSize: 30,
      lotsApplied: 1,
      sharesApplied: 30,
      applicationPrice: rupeesToPaise(150),
      status: 'NOT_ALLOTTED',
      allottedShares: 0,
      allotmentPrice: 0,
      listingDate: null,
      listingPrice: 0,
      currentPrice: 0,
      notes: 'Not allotted in this round',
      createdBy: 'Aman',
    },
    {
      ipoName: 'PQR Limited IPO',
      companyName: 'PQR Limited',
      appliedDate: new Date('2025-03-01'),
      dematName: 'Nanesh',
      applicationAmount: rupeesToPaise(30000),
      lotSize: 25,
      lotsApplied: 2,
      sharesApplied: 50,
      applicationPrice: rupeesToPaise(120),
      status: 'ALLOTTED',
      allottedShares: 50,
      allotmentPrice: rupeesToPaise(120),
      listingDate: new Date('2025-03-15'),
      listingPrice: rupeesToPaise(110),
      currentPrice: rupeesToPaise(105),
      notes: 'Listed at a discount',
      createdBy: 'Deepak',
    },
  ]);

  console.log('Seeding money transactions...');
  await MoneyTransaction.deleteMany({});
  await MoneyTransaction.insertMany([
    {
      personName: 'Rahul',
      personPhone: '9999900000',
      type: 'GIVEN',
      amount: rupeesToPaise(20000),
      transactionDate: new Date('2025-01-15'),
      dueDate: new Date('2025-04-15'),
      reason: 'Personal loan',
      notes: '',
      createdBy: 'Deepak',
    },
    {
      personName: 'Aman',
      personPhone: '9888800000',
      type: 'BORROWED',
      amount: rupeesToPaise(15000),
      transactionDate: new Date('2025-02-01'),
      dueDate: new Date('2025-05-01'),
      reason: 'Emergency fund',
      notes: '',
      createdBy: 'Aman',
    },
  ]);

  console.log('Seed complete. Both Deepak and Aman will see all seeded records.');
  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
