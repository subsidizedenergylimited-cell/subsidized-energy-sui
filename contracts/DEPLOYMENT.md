# Subsidized Energy — Testnet Deployment

| Item | Value |
|------|-------|
| **Network** | Sui Testnet |
| **Transaction Digest** | `C8k4UzwccEi2GEP99XgDLYeaTqgYoD4GR7rVxkd6FE1F` |
| **Package ID** | `0x62163791a217539103b137252c5d454a0af72a43d5c49561125907ddb8ed04f7` |
| **MintCap Object ID** | `0x56f61ae0fa7810f8cc22d9e37a6a1b2146fed378dc391c6db01ee26d64baf7f4` |
| **ProducerRegistry Object ID** | `0xdbb162108b0c87ca9130f5594194017cc80bb6e2a6277e896cabedd18a8be257` |
| **UpgradeCap Object ID** | `0x5a5980fce4d57979ae6401dda94f521e4be35da597d907e3bb926602eac318d6` |
| **Publisher Address** | `0xdcad9f598343948f03bedbee6bd618fca4bacdb4ffd120e96d26f7f8d6d92901` |

## Explorer

[View package on Sui Testnet Explorer](https://suiexplorer.com/object/0x62163791a217539103b137252c5d454a0af72a43d5c49561125907ddb8ed04f7?network=testnet)

## Notes

- `MintCap` is owned by the publisher address — the backend must hold this wallet to call `mint_certificate`.
- `ProducerRegistry` is a shared object — pass its ID as `&mut ProducerRegistry` in every mint call.
- `UpgradeCap` is also owned by the publisher. Guard it or burn it before mainnet.
