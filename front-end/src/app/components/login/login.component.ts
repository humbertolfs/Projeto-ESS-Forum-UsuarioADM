import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { Store } from '@ngrx/store'
import { AppState, changeUserInfo, changeUserLoggedStatus } from 'src/app/app.store'
import { ApiResponse, User } from '../../../../../common/types'
import { UsersService } from 'src/app/services/users.service'
import { NzMessageService } from 'ng-zorro-antd/message'
import { firstValueFrom, map, Observable } from 'rxjs'

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
    validateForm!: FormGroup

    logged: Observable<Boolean> = this.store.select('app').pipe(
        map((state: AppState) => {
            return state.logged
        })
    )

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private store: Store<{ app: AppState }>,
        private userService: UsersService,
        private message: NzMessageService
    ) {}

    ngOnInit(): void {
        this.validateForm = this.fb.group({
            userName: [null, [Validators.required]],
            password: [null, [Validators.required]],
        })
    }

    submitForm(): void {
        if (this.validateForm.valid) {
            let name: string = this.validateForm.value.userName
            let password: string = this.validateForm.value.password

            this.userService.login(name, password).subscribe(async (res: ApiResponse) => {
                if (res.status == 200) {
                    this.message.create('success', `Logged!`)
                    this.store.dispatch(changeUserInfo({ payload: res.result as User }))
                    this.store.dispatch(changeUserLoggedStatus({ payload: true }))

                    let previousURL: string = await firstValueFrom(
                        this.store.select('app').pipe(
                            map((state: AppState) => {
                                return state.previousURL
                            })
                        )
                    )

                    this.router.navigateByUrl(previousURL)
                } else {
                    this.message.create('error', `The credentials don't match or does not exist!`)
                }
            })
        } else {
            Object.values(this.validateForm.controls).forEach((control) => {
                if (control.invalid) {
                    control.markAsDirty()
                    control.updateValueAndValidity({ onlySelf: true })
                }
            })
        }
    }
}
