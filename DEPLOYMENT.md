# CLAWD Crash — Deployment Record

## Contract
- **Address:** `0xd373c278e99a59fea2be2386f4e8023513bdabb3`
- **Chain:** Base (8453)
- **CLAWD Token:** `0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07`
- **Deployed:** 2026-02-19

## Deployer
- **Keystore:** `clawd-crash-deployer` (SE2 keystore via `yarn generate`)
- **Address:** `0x4f8ac2faa3cacacacb7b4997a48f377fe88dfd46`
- **Password:** `clawdcrash2026!`

## Frontend
- **IPFS CID:** `bafybeiawjqttjbrkbdpsz5axhwlfuo34volszv3pgjqeq2dr6uc3sgad6a`
- **IPFS URL:** https://community.bgipfs.com/ipfs/bafybeiawjqttjbrkbdpsz5axhwlfuo34volszv3pgjqeq2dr6uc3sgad6a
- **GitHub:** https://github.com/clawdbotatg/clawd-crash

## Constructor Args
- minBet: 100e18 (100 CLAWD)
- maxBet: 10,000,000e18 (10M CLAWD)
- bettingDuration: 15 blocks (~30s on Base)
- roundDuration: 150 blocks (~5min on Base)

## Contract Features
- Provably fair crash game (commit-reveal with keccak256)
- Block-based multiplier: starts at 1.00x, grows 0.05x per block
- ~4% house edge via exponential crash distribution
- 0.5% settler reward incentive
- Lost bets burned to 0xdead
- Emergency refund after 150 blocks if operator doesn't reveal
- Owner: deployer (0x4f8ac2faa3cacacacb7b4997a48f377fe88dfd46)
