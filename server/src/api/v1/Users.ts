import { Request, Response } from 'express'
import { Api } from 'telegram'
import { Users as Model } from '../../model/entities/Users'
import { Endpoint } from '../base/Endpoint'
import { Auth } from '../middlewares/Auth'

@Endpoint.API()
export class Users {

  @Endpoint.GET({ middlewares: [Auth] })
  public async search(req: Request, res: Response): Promise<any> {
    const data = await req.tg.invoke(new Api.contacts.Search({
      q: req.query.username as string,
      limit: 10
    }))
    return res.send({ users: data.users })
  }

  @Endpoint.GET('/:username/:photo?', { middlewares: [Auth] })
  public async retrieve(req: Request, res: Response): Promise<any> {
    const { username, photo } = req.params
    if (photo === 'photo') {
      const file = await req.tg.downloadProfilePhoto(username, { isBig: false })
      res.setHeader('Content-Disposition', `inline; filename=${username === 'me' ? req.user.username : username}.jpg`)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', file.length)
      res.write(file)
      return res.end()
    }

    if (username === 'me' || username === req.user.username) {
      const username = req.userAuth.username || req.userAuth.phone
      Model.update(req.user.id, {
        ...username ? { username } : {},
        name: `${req.userAuth.firstName || ''} ${req.userAuth.lastName || ''}`.trim() || username
      })
    }

    const user = await Model.findOne({ username: username === 'me' ? req.user.username : username })
    if (!user) {
      throw { status: 404, body: { error: 'User not found' } }
    }

    return res.send({ user })
  }
}