import { DataSource } from 'typeorm';
import { InviteCode, InviteCodeStatus } from '../../src/invite-codes/invite-code.entity';
import { generateInviteCode } from '../../src/common/utils/generate-invite-code';

export default async function seed(dataSource: DataSource): Promise<void> {
  const inviteCodeRepository = dataSource.getRepository(InviteCode);

  // Check if any available invite codes exist
  const existingCodes = await inviteCodeRepository.find({
    where: { status: InviteCodeStatus.AVAILABLE },
  });

  if (existingCodes.length > 0) {
    console.log('  Available invite codes already exist:');
    existingCodes.forEach((ic) => {
      console.log(`    Code: ${ic.code}`);
    });
    return;
  }

  // Create initial invite code
  const code = generateInviteCode();
  const inviteCode = inviteCodeRepository.create({
    code,
    status: InviteCodeStatus.AVAILABLE,
  });
  await inviteCodeRepository.save(inviteCode);

  console.log('  Initial invite code created:');
  console.log(`    Code: ${code}`);
  console.log('');
  console.log('  Use this code to register the first admin user.');
  console.log('  Make sure your email is in ADMIN_EMAILS env variable.');
}
