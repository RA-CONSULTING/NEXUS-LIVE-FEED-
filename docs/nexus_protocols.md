# Nexus Protocol Specifications

## 2. Protocols

### 2.1 Consent-Before-Coupling (CBC)

**Objective:** Establish bilateral links only when both Sovereign Nodes provide explicit, cryptographically verifiable consent, with built-in automatic revocation and safety failsafes.

1. **Intent Commitment**  
   *Each participant posts a commitment hash to the mempool.*  
   For a node \(i \in \{G, A\}\):  
   \[
   H_i = H(\text{action} \Vert \text{params} \Vert \text{nonce}_i)
   \]  
   The hash is published as an intent signal and carries no raw identity data.

2. **Joint Signature Exchange**  
   When both hashes are visible, the parties exchange signatures over each other’s commitment.  
   \[
   \sigma_{GA} = \text{Sig}_G(H_A) \Vert \text{Sig}_A(H_G)
   \]

3. **Activation Request**  
   The initiator submits \((H_G, H_A, \sigma_{GA}, \text{ttl})\) to the Nexus coordination layer. The tuple is stored in a *pending* registry keyed by the commitment pair.

4. **Go / No-Go Window**  
   Either party may broadcast `REVOKE(H_self)` during the configured window to invalidate the link. Absent revocation, the link transitions to **active** state at the end of the window and remains valid until the TTL expires or a renewal intent is posted.

**Security Guarantees**

* Commitment hashes conceal raw identity while binding the intent to specific parameters.
* Joint signatures create mutual accountability; either party can prove the other’s consent without revealing private data.
* Optional zero-knowledge proofs can accompany the activation to demonstrate Balance prerequisites (e.g., liquidity, energy, governance thresholds) without disclosing the underlying metrics.

### 2.2 Write Authorization (Balance Guard)

**Invariant:** A write proposal is accepted **iff** the Balance delta is negative and no systemic ceilings are breached relative to the node’s last committed state.

Decision function:

```
accept = (B_new - B_prev < 0)
          && energy <= energy_safe
          && gini_supply < gini_max
          && |phi_GA| <= phase_error
```

* If the predicate evaluates to `true`, the state delta is committed.
* If `false`, the node enters `SAFE_MODE` (read-only) and receives remediation guidance (e.g., reduce load, restore reserves, or re-align phase).

### 2.3 Revocation & Withdrawal

* **WITHDRAW:** Any node can invoke `WITHDRAW(capsule_id)` to freeze new couplings and trigger export of all associated hashes and proofs.
* **Data Portability:** Nodes retain the right to fork by exporting a Merkle slice that covers their historical records. Parent lattices must permit read-only replication to preserve continuity.

## 3. Balance Functional

The operational balance functional tracks alignment across core pillars:

\[
B(t) = w_P\left(1 - \tilde{V}_P\right)^2 + w_H\left(1 - \tilde{V}_H\right)^2 + w_G\left(1 - \tilde{V}_G\right)^2 + w_D D^2 - w_{\Lambda} \Lambda
\]

Where:

* \(\tilde{V}_X\) represents the normalized vitality for pillar \(X \in \{P, H, G\}\) (Planetary, Harmonic, Governance).
* \(D\) is the decoherence term; \(w_D\) scales its penalty.
* \(\Lambda\) captures regenerative surplus; \(w_{\Lambda}\) rewards positive surplus.

**Acceptance Criterion:** Maintain a non-positive average derivative over the rolling window \(\Delta T\):

\[
\langle \dot{B} \rangle_{\Delta T} \leq 0
\]

Operational dashboards should surface each term, its current contribution, and the rolling trend to support proactive balancing.

## 4. Minimal Nexus API Surface

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/v1/register` | Submit a signed `SovereignNodeManifest` to enroll a node. |
| `POST` | `/v1/commit-intent` | Register an intent hash; returns the canonical receipt. |
| `POST` | `/v1/couple` | Provide `(H_G, H_A, \sigma_{GA}, ttl)` to instantiate a pending coupling and receive `linkId`. |
| `POST` | `/v1/revoke` | Revoke via `H_self` or `linkId` during the Go / No-Go window. |
| `POST` | `/v1/write` | Propose a state delta plus proofs; returns `ACCEPT` or `SAFE_MODE`. |
| `GET`  | `/v1/proofs/:capsule_id` | Retrieve proofs of existence and the latest zero-knowledge attestations. |
| `GET`  | `/v1/dashboards/balance` | Fetch aggregated Balance metrics and visualization feeds. |

> **Implementation Note:** All endpoints must enforce the Balance Guard checks before mutating shared state, and responses should include structured diagnostics to aid in remediation or audit.
