import * as express from 'express'
import type { Request, Response } from 'express'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import { v7 as uuidV7 } from 'uuid'

const router = express.Router()

router.use(express.json())

const upload = multer({
  dest: 'data/'
})

router.post('/upload/image', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.')
    return
  }

  const filePath = req.file.path
  const fileName = req.file.originalname
  const originalName = path.parse(fileName).name
  const ext = path.extname(fileName)

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    })

    const newFileName = `${originalName}-${uuidV7()}`
    await cloudinary.uploader.upload(filePath, {
      use_filename: true,
      public_id: newFileName
    })
    const fileId = newFileName
    const url = cloudinary.url(fileId, {
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    })

    fs.unlinkSync(filePath)

    res.status(StatusCodes.CREATED).send({ record: { fileId, url }, message: ReasonPhrases.CREATED })
  } catch (error) {
    if (error instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error, message: error.message })
    }
  }
})

export default router
