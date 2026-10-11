import express, { type Request, type Response, type NextFunction } from "express"
import { validateRouter } from "./routes/validate.js"
import { webhookRouter } from "./routes/webhook.js"

const app = express()
const PORT = Number(process.env.PORT ?? 3000)

// ── Raw body yakalama (webhook imza doğrulaması için) ─────────────────────────
app.use((req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction): void => {
	const chunks: Buffer[] = []
	req.on("data", (chunk: Buffer) => chunks.push(chunk))
	req.on("end", () => {
		req.rawBody = Buffer.concat(chunks)
		next()
	})
})

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// ── Rotalar ───────────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response): void => {
	res.json({ status: "ok", version: "1.0.0" })
})

app.use("/v1/validate", validateRouter)
app.use("/v1/webhook", webhookRouter)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response): void => {
	res.status(404).json({ error: "Bulunamadı." })
})

// ── Hata yönetimi — stack trace kullanıcıya gösterilmez ───────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
	console.error("[server error]", err instanceof Error ? err.message : err)
	res.status(500).json({ error: "Sunucu hatası oluştu. Tekrar dene." })
})

// ── Başlat ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`nexus-license-server :${PORT} — hazır`)
})
