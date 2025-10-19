# Nexus Coupling and Balance Protocols

## 2. Protocols

### 2.1 Consent-Before-Coupling (CBC)

**Goal:** Ensure bilateral consent before forming a coupling and enable automatic revocation.

1. **Intent commit (each side):** Compute `H_i = H(action || params || nonce_i)` and post to the mempool.
2. **Joint signature:** Build `sigma_GA = Sig_G(H_A) || Sig_A(H_G)` after both intents are visible.
3. **Activation:** Nexus stores `(H_G, H_A, sigma_GA, ttl)` and the link enters a pending state.
4. **Go/No-Go window:** Either party may post `REVOKE(H_self)` to cancel during the pending window. If no revocation arrives, the link becomes active until `ttl` expires or one party explicitly renews the link.

**Security properties**

* No raw identities are shared; only intent hashes and signatures appear on chain.
* Optional zero-knowledge proofs can demonstrate that both parties satisfy Balance prerequisites without revealing the underlying metrics.

### 2.2 Write Authorization (Balance Guard)

**Invariant:** Accept a write only when `ΔB < 0` relative to the node's last committed state and the system ceilings remain below their thresholds.

```
accept = (B_new - B_prev < 0)
          && energy <= energy_safe
          && gini_supply < gini_max
          && |phi_GA| <= phase_error
```

If `accept == false`, the node returns `SAFE_MODE`, switches to read-only, and surfaces remediation hints to the caller.

### 2.3 Revocation & Withdrawal

* Any node may issue `WITHDRAW(capsule_id)` to freeze new couplings, export all hashes and proofs, and detach from the lattice.
* **Right to fork:** The system must export a Merkle slice containing the node's records. The parent lattice cannot block read-only replication of the exported data.

## 3. Balance Functional (Operational Math)

The Balance functional monitors systemic health:

$$
B(t) = w_P (1 - \tilde{V}_P)^2 + w_H (1 - \tilde{V}_H)^2 + w_G (1 - \tilde{V}_G)^2 + w_D D^2 - w_\Lambda \, \Lambda
$$

A rolling-window average must satisfy the acceptance condition:

$$
\langle \dot{B} \rangle_{\Delta T} \le 0.
$$

Dashboards should expose each term so operators can diagnose imbalances quickly.

## 4. Nexus APIs (Minimal Surface)

* `POST /v1/register` — Submit a signed `SovereignNodeManifest`.
* `POST /v1/commit-intent` — Register an intent and receive the corresponding hash receipt `H_i`.
* `POST /v1/couple` — Provide `sigma_GA` and `ttl` to instantiate a link and obtain `linkId`.
* `POST /v1/revoke` — Revoke by `H_self` or `linkId`.
* `POST /v1/write` — Propose a state delta with proofs; returns `ACCEPT` or `SAFE_MODE`.
* `GET /v1/proofs/:capsule_id` — Retrieve proofs of existence plus the latest zero-knowledge proofs.
* `GET /v1/dashboards/balance` — Fetch aggregate `\mathcal{B}` metrics.
