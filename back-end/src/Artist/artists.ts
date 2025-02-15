import { Artist } from '../../../common/types'
import { readFileSync, promises } from 'fs'
import Path from 'path'
import AppConfig from '../app.config.json'

// Definição da classe da database que vai ler e escrever no arquivo data.json
// Cada função é responsável por uma tarefa especifica

import Logger from '@ptkdev/logger'
import { ArrayToMap, MapToArray, MapValuesToArray } from '../utils'

const log = new Logger()

class ArtistDB {
    db: Map<string, Artist>
    path: string

    constructor() {
        this.path = './data.test.json'
        if (AppConfig.MODE == 'DEV' || AppConfig.MODE == 'PROD') {
            this.path = './data.json'
        }
        if (AppConfig.MODE == 'TESTBACK'){
            this.path = './data.testBack.json'
        }
        if (AppConfig.MODE == 'TESTFRONT'){
            this.path = './data.testFront.json'
        }  
          
        
        
        let content: string = readFileSync(Path.resolve(__dirname, this.path), { encoding: 'utf8', flag: 'r' })

        let tempArr: any[] = JSON.parse(content)

        if (!Array.isArray(tempArr)) {
            log.error('Failed to parse data file!')
            throw new Error()
        }

        this.db = ArrayToMap(tempArr)
    }

    getArtist(id: string): Artist | undefined {
        return this.db.get(id)
    }

    getAllArtists(): Artist[] {
        return MapValuesToArray(this.db)
    }

    getSize(): number {
        return this.db.size
    }

    getArtistPage(pageId: number, ArtistPerPage: number, filterTerm: string | undefined): Artist[] {
        let tempArr: Artist[] = MapValuesToArray(this.db)

        if (filterTerm != '' && filterTerm != undefined) {
            let term: string = filterTerm.toLowerCase()

            tempArr = tempArr.filter((artist: Artist) => {
                if (artist.name.toLowerCase().includes(term)) {
                    return true
                }

                if (artist.id.toLowerCase().includes(term)) {
                    return true
                }
                
                if (artist.type.toLowerCase().includes(term)) {
                    return true
                }

                return false
            })
        }

        tempArr = tempArr.slice((pageId - 1) * ArtistPerPage, Math.min(pageId * ArtistPerPage, this.db.size))

        return tempArr
    }

    deleteArtist(id: string): Promise<Boolean>{
        let find: Boolean = this.db.delete(id)

        if (find == false) {
            return new Promise<Boolean>((resolve, reject) => {
                resolve(false)
            })
        }

        let result: Promise<Boolean> = this.saveArtists()

        return result
             
       
    }

    createArtist(artist: Artist): Promise<Boolean> {
        this.db.set(artist.id, artist)

        let result: Promise<Boolean> = this.saveArtists()

        return result
    }

    editArtist(artist: Artist): Promise<Boolean> {
        let find: Artist | undefined = this.db.get(artist.id)

        if (find == undefined) {
            return new Promise<Boolean>((resolve) => {
                resolve(false)
            })
        }

        this.db.set(find.id, artist)

        let result: Promise<Boolean> = this.saveArtists()

        return result
    }

    addMention(id: string, mentions: number): Promise<Boolean> {
        let find: Artist | undefined = this.db.get(id)

        if (find == undefined) {
            return new Promise<Boolean>((resolve) => {
                resolve(false)
            })
        }

        this.db.set(find.id, {
            ...find,
            mentions: find.mentions + mentions,
        })

        let result: Promise<Boolean> = this.saveArtists()

        return result
    }

    async saveArtists(): Promise<Boolean> {
        try {
            await promises.writeFile(Path.resolve(__dirname, this.path), JSON.stringify(MapToArray(this.db)), {
                flag: 'w',
            })

            return true
        } catch (err: any) {
            log.error(err)

            return false
        }
    }
}

export default ArtistDB
