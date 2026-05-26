import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())

// Accept raw ZPL in the body (text/plain) or JSON { zpl: '...' }
app.post('/api/labelary', express.text({ type: '*/*', limit: '2mb' }), async (req, res) => {
  try {
    let zpl = ''
    if (req.is('application/json')) {
      const obj = JSON.parse(req.body || '{}')
      zpl = obj.zpl || ''
    } else {
      zpl = req.body || ''
    }

    if (!zpl) {
      return res.status(400).json({ error: 'Empty ZPL body' })
    }

    // Query params to control printer / label size similar to Labelary API
    const printer = req.query.printer || '8dpmm'
    const labels = req.query.labels || '4x6'
    const index = req.query.index || '0'

    const url = `https://api.labelary.com/v1/printers/${encodeURIComponent(printer)}/labels/${encodeURIComponent(labels)}/${encodeURIComponent(index)}/`

    // Use native FormData (Node 18+) and global fetch
    const form = new FormData()
    // Create a Blob from the ZPL string so FormData treats it as a file
    const blob = new Blob([zpl], { type: 'text/plain' })
    form.append('file', blob, 'label.zpl')

    const resp = await fetch(url, { method: 'POST', body: form, headers: { 'X-Quality': 'grayscale', 'X-Linter': 'On' } })
    const contentType = resp.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await resp.arrayBuffer()
    res.status(resp.status)
    res.set('Content-Type', contentType)
    res.send(Buffer.from(arrayBuffer))
  } catch (err) {
    console.error('Labelary proxy error:', err)
    res.status(500).json({ error: 'Proxy error', details: String(err) })
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Labelary proxy listening on http://localhost:${PORT}/api/labelary`)
})
