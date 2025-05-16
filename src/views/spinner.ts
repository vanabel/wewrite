export  class Spinner { 
	private spinnerEl: HTMLElement;
	private spinnerText: HTMLDivElement;
	constructor(spinnerEl: HTMLElement) {
		console.log('creating spinner');
		
		this.spinnerEl = spinnerEl;
		this.spinnerEl.addClass("spinner-container");
		const dots = this.spinnerEl.createDiv({
			cls: "spinner-dots",
		});
		for (let i = 0; i < 6; i++) {
			const dot = dots.createDiv({
				cls: `spinner-dot spinner-dot${i + 1}`,
			});
			dot.style.animationDelay = `${i * 0.3}s`;
		}
		this.spinnerText = this.spinnerEl.createDiv({
			cls: "spinner-text"});
	}
	showSpinner(text: string = "") {
		this.spinnerEl.style.display = "flex";
		this.spinnerText.setText(text);
	}
	isSpinning() {
		return this.spinnerEl.style.display !== "none";
	}

	hideSpinner() {
		this.spinnerEl.style.display = "none";
	}
	unload() {
		this.spinnerEl.remove();
	}
}

