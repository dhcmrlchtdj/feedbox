import { Component } from "inferno"
import * as http from "../global/http"
import { sleep } from "../global/shared"
import { email, feeds, type Feed, type User } from "../global/state"
import { Add } from "./add"
import { Auth } from "./auth"
import { Heading } from "./heading"
import { List } from "./list"
import { Notification } from "./notification"

export class App extends Component {
	override state: Readonly<{
		initialized: boolean
		error: string | null
	}>
	private cleanup: (() => void)[]

	constructor() {
		super()
		this.state = {
			initialized: false,
			error: null,
		}
		this.cleanup = []
	}

	override componentWillMount() {
		// keep the loading animation
		const delayAnimation = sleep(1000)
		Promise.all([
			http.get<User>("/api/v1/user"),
			http.get<Feed[]>("/api/v1/feeds"),
		])
			.then(async ([user, resp]) => {
				email.set(user.addition.email)
				feeds.set(resp)
				await delayAnimation
				this.setState({ initialized: true })
			})
			.catch(async (err: Error) => {
				await delayAnimation
				this.setState({
					initialized: true,
					error: err.message,
				})
			})
	}
	override componentWillUnmount() {
		this.cleanup.forEach((fn) => fn())
	}

	override render() {
		if (this.state.initialized) {
			if (this.state.error) {
				return (
					<div class="container grid-sm">
						<Auth err={this.state.error}></Auth>
					</div>
				)
			} else {
				return (
					<div class="container grid-sm">
						<div class="columns">
							<Heading initialized={true}></Heading>
							<Add></Add>
							<List></List>
						</div>
						<Notification></Notification>
					</div>
				)
			}
		} else {
			return (
				<div class="container grid-sm">
					<div class="columns">
						<div class="column col-12">
							<div class="loading loading-lg"></div>
						</div>
					</div>
				</div>
			)
		}
	}
}
