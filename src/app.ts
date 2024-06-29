import express from "express"
import { createReadStream } from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

type CompteType = {
	numero: number,
	nom: string,
	classe: number
}

type PcgType = {
	classe: {
		[key: string]: {
			titre: string,
			comptes: CompteType[]
		}
	}
}

const app = express()
const PORT = 3000
const PCGReadStream = createReadStream(path.resolve('' + 'pcg/pcg-2005-par-classe-v2.json'), {encoding: "utf8"})
let	PCG: string | PcgType = ""

PCGReadStream.on("open", () => console.log("[INFO]: Reading datas"))
PCGReadStream.on("data", (chunk) => PCG += chunk as string)
PCGReadStream.on('end', () => {
	console.log("[INFO]: Datas ready")
	PCG = JSON.parse(PCG as string) as PcgType

	app.get("/", (_req, res) => {
		res.status(200).json({ status: 200, data: PCG })
	})

	app.get("/classe/:classe", (req, res) => {
		const classe = req.params["classe"]
		if (!classe)
			res.status(400).json({ status: 400, message: "Bad Request" })
		else {
			const pcg = (PCG as PcgType).classe[classe]
			if (!pcg)
				res.status(404).json({ status: 404, message: "Not Found" })
			else
				res.status(200).json({ status: 200, data: pcg })
		}
	})

	app.get("/comptes/search/:query", (req, res) => {
		const query = req.params["query"]
		if (!query)
			res.status(400).json({ status: 400, message: "Bad Request" })
		else {
			const searchResult = []
			for (const num in (PCG as PcgType).classe) {
				const comptes = (PCG as PcgType).classe[num].comptes
				comptes.forEach((compte) => {
					if (compte.nom.includes(query))
						searchResult.push(compte)
				})
			}
			if (searchResult.length === 0)
				res.status(404).json({ status: 404, message: "Not Found" })
			else
				res.status(200).json({ status: 200, data: searchResult })
		}
	})

	app.get("/comptes/numero/:numero", (req, res) => {
		const numero = parseInt(req.params["numero"])
		if (numero === 0)
			res.status(400).json({ status: 400, message: "Bad Request" })
		else {
			let compte: CompteType = { numero: 0, nom: "", classe: 0}
			for (const num in (PCG as PcgType).classe) {
				const comptes = (PCG  as PcgType).classe[num].comptes
				compte = comptes.find((c) => c.numero == numero)
				if (!compte)
					continue
				else
					res.status(200).json({ status: 200, data: compte })
			}
			res.status(404).json({ status: 404, message: "Not Found" })
		}
	})

	app.get("/numeros", (_req, res) => {
		const numeros = []
		for (const num in (PCG as PcgType).classe) {
			const comptes = (PCG as PcgType).classe[num].comptes
			numeros.push(
				comptes.map(c => c.numero)
			)
		}
		res.status(200).json({ status: 200, data: numeros.flat() })
	})

	app.listen(PORT, () => console.log(`[INFO]: Server listen on http://localhost:${PORT}`))

})
