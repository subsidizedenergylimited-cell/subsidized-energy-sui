module subsidized_energy::sub {
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::String;

    // ── Error codes ──────────────────────────────────────────────────────────
    const EDayAlreadyMinted: u64 = 1;

    // ── Core objects ─────────────────────────────────────────────────────────

    /// Daily solar-energy certificate.
    ///
    /// Soulbound pattern: `key` only, no `store`.
    /// `transfer::transfer` (used below) works on any `key` object, but
    /// `transfer::public_transfer` — which the holder would need to move it —
    /// requires `key + store`.  Omitting `store` means only this module can
    /// ever call transfer on a SubCertificate, making it permanently bound to
    /// the original recipient.
    public struct SubCertificate has key {
        id: UID,
        producer: address,
        watt_hours: u64,       // integer Wh, e.g. 6400 = 6.4 kWh
        production_day: u64,   // YYYYMMDD, e.g. 20260611
        walrus_blob_id: String, // Walrus blob ID for the raw inverter reading
        minted_at: u64,        // epoch ms from Clock
    }

    /// Mint authority — created once in `init`, held by the backend.
    /// `store` lets it be wrapped inside other objects if needed later.
    public struct MintCap has key, store {
        id: UID,
    }

    /// Shared registry tracking the latest minted production_day per producer.
    /// Lives on-chain so the one-per-day rule is enforced without trusting
    /// the caller.
    public struct ProducerRegistry has key {
        id: UID,
        last_day: Table<address, u64>,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    public struct CertificateMinted has copy, drop {
        certificate_id: ID,
        producer: address,
        watt_hours: u64,
        production_day: u64,
        walrus_blob_id: String,
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        // Publisher receives the single MintCap — backend stores it as the
        // mint authority for all future certificate issuance.
        transfer::transfer(MintCap { id: object::new(ctx) }, ctx.sender());

        // Shared so the backend and any validator can read/write the registry
        // in the same transaction without owning it.
        transfer::share_object(ProducerRegistry {
            id: object::new(ctx),
            last_day: table::new(ctx),
        });
    }

    // ── Entry functions ───────────────────────────────────────────────────────

    /// Mint a SubCertificate and deliver it directly to `producer`.
    ///
    /// One-per-day guard: we enforce that `production_day` is strictly greater
    /// than any previously recorded day for this producer.  Using strict `>`
    /// rather than `!=` also prevents backdating — a day once passed can never
    /// be re-issued even if a gap exists.
    public fun mint_certificate(
        _cap: &MintCap,
        registry: &mut ProducerRegistry,
        producer: address,
        watt_hours: u64,
        production_day: u64,
        walrus_blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        if (table::contains(&registry.last_day, producer)) {
            let last = *table::borrow(&registry.last_day, producer);
            assert!(production_day > last, EDayAlreadyMinted);
            *table::borrow_mut(&mut registry.last_day, producer) = production_day;
        } else {
            table::add(&mut registry.last_day, producer, production_day);
        };

        let cert = SubCertificate {
            id: object::new(ctx),
            producer,
            watt_hours,
            production_day,
            walrus_blob_id,
            minted_at: clock.timestamp_ms(),
        };

        event::emit(CertificateMinted {
            certificate_id: object::id(&cert),
            producer,
            watt_hours,
            production_day,
            walrus_blob_id,
        });

        // Module-controlled transfer enforces the soulbound property.
        // The recipient holds the object but can never transfer it onward
        // because SubCertificate lacks `store`.
        transfer::transfer(cert, producer);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    #[test_only]
    use std::unit_test::destroy;

    #[test]
    fun test_mint_success() {
        let mut ctx = tx_context::dummy();
        let clock = clock::create_for_testing(&mut ctx);

        let cap = MintCap { id: object::new(&mut ctx) };
        let mut registry = ProducerRegistry {
            id: object::new(&mut ctx),
            last_day: table::new(&mut ctx),
        };

        let producer = @0xCAFE;

        mint_certificate(
            &cap,
            &mut registry,
            producer,
            6400,
            20260611,
            std::string::utf8(b"blobid_abc123"),
            &clock,
            &mut ctx,
        );

        // Registry must now record this producer's day.
        assert!(*table::borrow(&registry.last_day, producer) == 20260611, 0);

        clock::destroy_for_testing(clock);
        destroy(cap);
        destroy(registry);
    }

    #[test]
    #[expected_failure(abort_code = EDayAlreadyMinted)]
    fun test_remint_same_day_aborts() {
        let mut ctx = tx_context::dummy();
        let clock = clock::create_for_testing(&mut ctx);

        let cap = MintCap { id: object::new(&mut ctx) };
        let mut registry = ProducerRegistry {
            id: object::new(&mut ctx),
            last_day: table::new(&mut ctx),
        };

        let producer = @0xCAFE;

        mint_certificate(
            &cap,
            &mut registry,
            producer,
            6400,
            20260611,
            std::string::utf8(b"blobid_abc123"),
            &clock,
            &mut ctx,
        );

        // Second mint for the same day must abort with EDayAlreadyMinted.
        mint_certificate(
            &cap,
            &mut registry,
            producer,
            7200,
            20260611,
            std::string::utf8(b"blobid_xyz456"),
            &clock,
            &mut ctx,
        );

        clock::destroy_for_testing(clock);
        destroy(cap);
        destroy(registry);
    }
}
