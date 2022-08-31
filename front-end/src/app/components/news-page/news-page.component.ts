import { Component, OnInit } from '@angular/core'
import { News, ApiResponse, User, Like } from '../../../../../common/types'
import { NewsManagementService } from 'src/app/services/news-management.service'
import { ActivatedRoute } from '@angular/router'
import { imageFallBack } from '../../../util'
import { firstValueFrom, map, Observable, Subscription, take } from 'rxjs'
import { Store } from '@ngrx/store'
import { AppState } from 'src/app/app.store'
import { NzMessageRef, NzMessageService } from 'ng-zorro-antd/message'
import { UsersService } from 'src/app/services/users.service'

@Component({
    selector: 'app-news-page',
    templateUrl: './news-page.component.html',
    styleUrls: ['./news-page.component.css'],
})
export class NewsPageComponent implements OnInit {
    imgFall: string = imageFallBack

    hasUserLikedTheNews: boolean = false

    userInfo: Observable<User> = this.store.select('app').pipe(
        map((state: AppState) => {
            return state.user
        })
    )

    news: News = {
        id: '',
        cover: '',
        authorId: '',
        title: '',
        date: '',
        markdownText: '',
        edited: false,
        views: 0,
        likes: [],
        comments: [],
        tags: [],
    }

    authorInfo: User = {
        id: '',
        name: '',
        password: '',
        avatar: '',
        cover: '',
        type: 'normal',
    }

    commentContent: string = ''

    isAdmin: Observable<boolean> = this.store.select('app').pipe(
        map((state: AppState) => {
            return (state.user.type == 'admin') as boolean
        })
    )

    isUserLogged: Observable<boolean> = this.store.select('app').pipe(
        map((state: AppState) => {
            return state.logged
        })
    )

    usersComments: Map<string, User> = new Map()

    constructor(
        private newsManagementService: NewsManagementService,
        private route: ActivatedRoute,
        private store: Store<{ app: AppState }>,
        private message: NzMessageService,
        private userService: UsersService
    ) {
        const id: string | null = this.route.snapshot.paramMap.get('id')

        if (id != null) {
            this.newsManagementService.get(id).subscribe((res: ApiResponse) => {
                if (res.status == 200) {
                    this.news = res.result as News

                    this.news.views += 1

                    this.newsManagementService.addView(id).subscribe(() => {
                        return
                    })

                    this.userService.get(this.news.authorId).subscribe((res: ApiResponse) => {
                        if (res.status == 200) {
                            this.authorInfo = res.result as User
                        } else {
                            this.message.create('error', `Something went wrong!`)
                        }
                    })

                    let userId: string = ''

                    let userIdSubscription: Subscription = this.userInfo.pipe(take(1)).subscribe((user: User) => (userId = user.id))
                    userIdSubscription.unsubscribe()

                    for (let i = 0; i < this.news.likes.length; i++) {
                        if (this.news.likes[i].authorId == userId) {
                            this.hasUserLikedTheNews = true
                            break
                        }
                    }

                    this.loadComments()
                } else {
                    this.message.create('error', `Something went wrong!`)
                }
            })
        }
    }

    private async loadComments() {
        let loadingMsg: NzMessageRef = this.message.loading('Loading comments...', { nzDuration: 0 })

        for (let i = 0; i < this.news.comments.length; i++) {
            let response: ApiResponse = await firstValueFrom(this.userService.get(this.news.comments[i].authorId))

            this.usersComments.set((response.result as User)!.id, response.result as User)
        }

        this.message.remove(loadingMsg.messageId)
    }

    ngOnInit(): void {}

    toggleLikeNews(): void {
        let userId: string = ''

        let userIdSubscription: Subscription = this.userInfo.pipe(take(1)).subscribe((user: User) => (userId = user.id))
        userIdSubscription.unsubscribe()

        if (userId == '') {
            this.message.create('warning', `Please login first`)
            return
        }

        let liked: boolean = false

        for (var i = 0; i < this.news.likes.length; i++) {
            if (this.news.likes[i].authorId == userId) {
                liked = true
                break
            }
        }

        if (liked) {
            this.hasUserLikedTheNews = false

            for (var i = 0; i < this.news.likes.length; i++) {
                if (this.news.likes[i].authorId == userId) {
                    this.news.likes.splice(i, 1)
                    break
                }
            }

            this.newsManagementService.removeLike(this.news.id, userId).subscribe((res: ApiResponse) => {
                if (res.status != 200) {
                    this.message.create('error', `Something went wrong!`)
                }
            })
        } else {
            this.hasUserLikedTheNews = true

            this.news.likes.push({ authorId: userId } as Like)

            this.newsManagementService.addLike(this.news.id, userId).subscribe((res: ApiResponse) => {
                console.log(res)
                if (res.status != 200) {
                    this.message.create('error', `Something went wrong!`)
                }
            })
        }
    }
}
