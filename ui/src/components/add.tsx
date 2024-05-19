import { Component } from "inferno"
import * as http from "../global/http"
import { genClass } from "../global/shared"
import { createFeedsSetter, newNotification, type Feed } from "../global/state"

export class Add extends Component {
	override state: Readonly<{ url: string; loading: boolean }>
	constructor() {
		super()
		this.state = {
			url: "",
			loading: false,
		}
	}

	handleInput = (event: Event) => {
		this.setState({ url: (event.target as HTMLInputElement).value })
	}

	handleSubmit = (event: Event) => {
		event.preventDefault()

		if (this.state.loading === true) {
			window.alert("processing")
			return
		}

		if (this.state.url === "") return
		this.setState({ loading: true })

		const setFeeds = createFeedsSetter()
		http.put<Feed[]>("/api/v1/feeds/add", { url: this.state.url })
			.then((resp) => setFeeds(resp))
			.then(() => newNotification("added"))
			.catch((err: Error) => {
				window.alert(err.message)
				location.reload()
			})
			.then(() => {
				this.setState({
					url: "",
					loading: false,
				})
			})
	}

	override render() {
		return (
			<>
				<div class="column col-12">
					<form
						class="input-group"
						onSubmit={this.handleSubmit}
					>
						<input
							class="form-input"
							type="text"
							placeholder="feed url"
							value={this.state.url}
							onInput={this.handleInput}
						/>
						<button
							type="submit"
							class={genClass("btn btn-primary input-group-btn", [
								this.state.loading,
								"loading disabled",
							])}
							disabled={this.state.loading}
						>
							add
						</button>
					</form>
				</div>
				<div class="column col-12">
					<div class="divider"></div>
				</div>
			</>
		)
	}
}
