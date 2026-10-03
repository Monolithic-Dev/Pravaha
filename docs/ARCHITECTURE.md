# System Architecture — Pravaha

Read `PRD.md`, `CLOUDINARY.md` and `TRD.md` first; these diagrams show those decisions in motion.

## 0. Whole system (Oct 3)

The current shape of the product, including Learning Paths, the Concept Map, study notes, data saver, the Cloudinary asset index and the status page. The diagrams below it are the original design views.

```mermaid
flowchart TB
  subgraph Org["Organizer"]
    O["Studio · upload · Insights"]
  end
  subgraph Learn["Learner · phone or laptop"]
    L["Ask · Find · Watch · Concepts · Learn · Saved · Notes"]
  end

  subgraph Cloudinary["Cloudinary: the media plane"]
    U["Signed upload preset"]
    AI["auto_transcription · auto_chaptering · hi-IN translate"]
    T["Transformations on demand: Moments · Reels · cards · previews · data saver"]
    S["HLS streaming · f_auto · q_auto"]
    X["Tags + context + Search API"]
  end

  subgraph App["Next.js 16 on Vercel: the knowledge plane"]
    W["Signed webhook"]
    R["Retrieval · question understanding"]
    G["Grounded answer + citation validation"]
    P["Study Packs · Learning Paths · Concept Map · Notes"]
    ST["/status · /api/health"]
  end

  DB[("Neon Postgres: segments · full-text index · packs · insights")]
  M["Gemini → Groq fallback chain · circuit breaker"]

  O -- video bytes, signed --> U
  U --> AI
  AI -- webhook --> W
  W -- time-coded segments --> DB
  W -- study pack --> P
  P -- tags and context --> X
  L -- question --> R
  R --> DB
  R --> G
  G <--> M
  G -- validated citations + clip URLs --> L
  T -- clips · reels · shorts --> L
  S -- adaptive video --> L
  ST -. checks .-> DB
  ST -. checks .-> M
  ST -. credits .-> Cloudinary
```

## 1. System Context

```mermaid
flowchart TB
    Organizer["Organizer<br/>(Studio)"]
    Learner["Learner<br/>(phone / laptop)"]
    Pravaha(["Pravaha<br/>Next.js on Vercel"])
    Cloudinary["Cloudinary<br/>ingest · transcription · chaptering<br/>player · transformations · CDN"]
    Gemini["Gemini<br/>grounded answers · Study Packs"]
    DB[("Neon Postgres<br/>sessions · segments · study packs · insights")]

    Organizer -->|passcode, upload| Pravaha
    Learner -->|watch, find, ask, share| Pravaha
    Organizer -.->|video bytes, signed| Cloudinary
    Learner -.->|HLS, clips, thumbnails| Cloudinary
    Cloudinary -->|webhook| Pravaha
    Pravaha --> DB
    Pravaha -->|question + retrieved segments| Gemini
```

Media never passes through Pravaha. Cloudinary is the media plane; Pravaha is the knowledge plane.

## 2. Components

```mermaid
flowchart TB
    subgraph Client["Browser"]
        Home["/ · Ask bar + Library"]
        Search["/search · Answer + Moments found"]
        Watch["/watch/id · CldVideoPlayer"]
        Studio["/studio · CldUploadWidget"]
    end

    subgraph API["Vercel route handlers"]
        Sess["/api/organizer/session"]
        Sign["/api/upload-signature"]
        Hook["/api/webhooks/cloudinary"]
        Lect["/api/lectures"]
        Find["/api/search"]
        Ask["/api/ask"]
    end

    subgraph Lib["src/lib (pure logic, unit-tested)"]
        Seg["segments.ts"]
        Cit["citations.ts"]
        Med["media.ts (momentUrl)"]
        Auth["auth.ts"]
    end

    Studio --> Sess & Sign & Lect
    Home --> Lect
    Search --> Find & Ask
    Hook --> Seg
    Ask --> Cit & Med
    Sign --> Auth
```

## 3. Ingest — Upload to Ready

```mermaid
sequenceDiagram
    participant S as Studio
    participant A as Pravaha API
    participant D as Postgres
    participant C as Cloudinary

    S->>A: POST /api/lectures {title, speaker, rightsConfirmed}
    A->>D: INSERT lecture (processing, unlisted, public_id = pravaha/<id>)
    S->>A: POST /api/upload-signature {paramsToSign}
    A-->>S: signature (allow-listed params only, AI params live on the signed preset)
    S->>C: Upload video directly (Upload Widget, real progress)
    C->>C: Transcribe + chapter (async)
    C->>A: Webhook {info_kind: auto_transcription, complete}
    A->>A: Verify signature (raw body + timestamp)
    A->>C: GET {public_id}.transcript (+ chapters)
    A->>A: buildSegments() ~10 s windows
    A->>D: TX: replace segments, status = ready
    A-)C: warm g_auto tracking-crop (best effort)
    A-)A: after(): generate Study Pack (Gemini)
    S->>A: poll GET /api/lectures → ready
```

Failure branch: `info_status: failed` → `transcript_failed`; the video still plays (NFR4).

## 4. Find

```mermaid
flowchart LR
    Q["q = 'gradient descent'"] --> V["Zod: 2–200 chars"]
    V --> F[("segments ⋈ lectures<br/>public + ready<br/>websearch_to_tsquery<br/>ts_rank_cd · ts_headline")]
    F --> R["Results: session · speaker · t · snippet"]
    R --> W["/watch/id?t=754"]
```

No AI, no Cloudinary API call — milliseconds.

## 5. Ask — the core flow

```mermaid
flowchart TD
    Q["Question"] --> RL{"Rate limit OK?<br/>(ask_requests)"}
    RL -- No --> E429["429 + Retry-After"]
    RL -- Yes --> RET["Retrieve: OR-ed tsquery, top 12,<br/>± neighbour segments"]
    RET --> NONE{"Any segments?"}
    NONE -- No --> NF["not_found<br/>(no model call)"]
    NONE -- Yes --> CL["Gemini chain, then Groq backup: answer + cited_segment_ids<br/>(JSON schema, 12 s per model)"]
    CL -- error/timeout --> FB["fallback: top 4 segments as clips"]
    CL --> VAL["validateAnswer():<br/>drop IDs not retrieved · strip markers · renumber"]
    VAL --> ZERO{"≥1 valid citation?"}
    ZERO -- No --> NF
    ZERO -- Yes --> OUT["answered: text + citations<br/>each with momentUrl"]
```

The model can only cite what retrieval returned, and anything else is deleted before the learner sees it.

## 6. Moments

```mermaid
flowchart LR
    SEG["Segment<br/>754.2 → 764.9 s"] --> MU["momentUrl()<br/>pad ±1.5 s · cap 60 s"]
    MU --> URL["res.cloudinary.com/…/so_752.7,eo_766.4/<br/>c_fill,ar_9:16,w_720,g_auto/<br/>l_text:…caption…/fl_layer_apply,so_…,eo_…/ (one per caption card)<br/>f_auto,q_auto/pravaha/id.mp4"]
    URL --> CDN["Cloudinary generates once,<br/>CDN-caches"]
    CDN --> SH["navigator.share → WhatsApp"]
```

## 7. Data

```mermaid
erDiagram
    lectures ||--o{ segments : has
    lectures {
        uuid id PK
        text public_id UK
        text title
        text speaker
        enum status
        enum visibility
        real duration_s
        timestamptz rights_confirmed_at
    }
    segments {
        bigserial id PK
        uuid lecture_id FK
        real start_s
        real end_s
        text text
        text chapter_title
        jsonb words
        tsvector search_vector
    }
    lectures ||--o| study_packs : has
    segments ||--o{ moment_events : counts
    study_packs {
        uuid lecture_id PK
        jsonb pack
        text model
    }
    ask_log {
        bigserial id PK
        text question
        text status
        uuid_array lecture_ids
    }
    moment_events {
        bigserial id PK
        bigint segment_id FK
        text kind
    }
    ask_requests {
        bigserial id PK
        text ip_hash
        timestamptz created_at
    }
```

## 8. Organizer Auth

```mermaid
sequenceDiagram
    participant O as Organizer
    participant A as Pravaha API
    O->>A: POST /api/organizer/session {passcode}
    A->>A: timingSafeEqual(sha256(passcode), sha256(ORGANIZER_PASSCODE))
    A-->>O: Set-Cookie pravaha_org = expiry.HMAC(SESSION_SECRET) (HttpOnly, Secure, Lax)
    O->>A: POST /api/upload-signature (cookie)
    A->>A: verify HMAC + expiry → else 401
```

## 9. Deployment

```mermaid
flowchart LR
    Dev["feature/* branch"] -->|push| GH["GitHub"]
    GH --> CI["Actions: lint · typecheck · unit"]
    GH --> Prev["Vercel preview per PR"]
    CI & Prev --> PR["PR → merge commit"]
    PR --> Main["main"] --> Prod["Vercel production"]
    Prod --> Neon[("Neon")]
    Prod --> CLD["Cloudinary"]
    Prod --> GEM["Gemini"]
```

Branching rules: `GIT_WORKFLOW.md`.
