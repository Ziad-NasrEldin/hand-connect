import { createDemoSeedData, demoSeedVersion } from '../src/services/seed-data';

const seed = createDemoSeedData();

console.log(`Herafy demo seed ${demoSeedVersion}`);
console.log(`Users: ${seed.users.length}`);
console.log(`Providers: ${seed.providers.length}`);
console.log(`Approved providers: ${seed.providers.filter((provider) => provider.status === 'approved').length}`);
console.log(`Identity documents: ${seed.identityDocuments.length}`);
console.log(`Reviews: ${seed.reviews.length}`);
console.log(`Conversations: ${seed.conversations.length}`);
console.log(`Visibility requests: ${seed.visibilityRequests.length}`);
