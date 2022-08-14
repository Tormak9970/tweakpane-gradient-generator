import {ClassName, createValue, Value, View, ViewProps} from '@tweakpane/core';

interface Config {
	value: Value<GradientStop[]>;
	viewProps: ViewProps;
}

// Create a class name generator from the view name
// ClassName('tmp') will generate a CSS class name like `tp-tmpv`
const className = ClassName('gradient');

// Custom view class should implement `View` interface
export class PluginView implements View {
	public readonly element: HTMLElement;
	private _value: Value<GradientStop[]>;

	addStop: HTMLDivElement;
	removeStop: HTMLDivElement;
	private _canvas: HTMLCanvasElement;

	private _cycleIdx: HTMLElement;
	private _idxDisp: HTMLElement;
	nCycleIdx: HTMLElement;
	pCycleIdx: HTMLElement;
	setPos: HTMLElement;

	colorButton: HTMLDivElement;

	stopIdx:Value<number> = createValue<number>(0);

	constructor(doc: Document, config: Config) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);

		// Receive the bound value from the controller
		this._value = config.value;
		// Handle 'change' event of the value
		this._value.emitter.on('change', this._onValueChange.bind(this));

		// Create child elements
		{
			const arCont = doc.createElement('div');
			arCont.classList.add(className('ar_cont'));

			this.addStop = doc.createElement('div');
			this.addStop.classList.add(className('edit_stops'));
			this.addStop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/></svg>`;
			arCont.appendChild(this.addStop);

			this.removeStop = doc.createElement('div');
			this.removeStop.classList.add(className('edit_stops'));
			this.removeStop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M400 288h-352c-17.69 0-32-14.32-32-32.01s14.31-31.99 32-31.99h352c17.69 0 32 14.3 32 31.99S417.7 288 400 288z"/></svg>`;
			arCont.appendChild(this.removeStop);

			this.element.appendChild(arCont);
		}


		{
			const canvasCont = doc.createElement('div');
			canvasCont.classList.add(className('canvas_cont'));

			this._canvas = doc.createElement('canvas');
			this._canvas.height = 20;
			this._canvas.width = 150;
			this._canvas.classList.add(className('canvas'));
			canvasCont.appendChild(this._canvas);
			this.element.appendChild(canvasCont);
		}
		

		{
			const ctrlCont = doc.createElement('div');
			ctrlCont.classList.add(className('ctrl_cont'));

			this._cycleIdx = doc.createElement('div');
			this._cycleIdx.classList.add(className('cycle_idx'));

			this.nCycleIdx = doc.createElement('div');
			this.nCycleIdx.classList.add(className('cycle_idx_btn'));
			this.nCycleIdx.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M137.4 406.6l-128-127.1C3.125 272.4 0 264.2 0 255.1s3.125-16.38 9.375-22.63l128-127.1c9.156-9.156 22.91-11.9 34.88-6.943S192 115.1 192 128v255.1c0 12.94-7.781 24.62-19.75 29.58S146.5 415.8 137.4 406.6z"/></svg>`;
			this._cycleIdx.appendChild(this.nCycleIdx);

			this._idxDisp = doc.createElement('div');
			this._idxDisp.classList.add(className('cycle_idx_disp'));
			this._idxDisp.innerText = this.stopIdx.rawValue.toString();
			this._cycleIdx.appendChild(this._idxDisp);

			this.pCycleIdx = doc.createElement('div');
			this.pCycleIdx.classList.add(className('cycle_idx_btn'));
			this.pCycleIdx.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M118.6 105.4l128 127.1C252.9 239.6 256 247.8 256 255.1s-3.125 16.38-9.375 22.63l-128 127.1c-9.156 9.156-22.91 11.9-34.88 6.943S64 396.9 64 383.1V128c0-12.94 7.781-24.62 19.75-29.58S109.5 96.23 118.6 105.4z"/></svg>`;
			this._cycleIdx.appendChild(this.pCycleIdx);

			ctrlCont.appendChild(this._cycleIdx);

			this.setPos = doc.createElement('div');
			this.setPos.classList.add(className('set_pos'));

			const label = doc.createElement('div');
			label.innerText = "Pos:";
			label.classList.add(className('set_pos_label'));
			this.setPos.appendChild(label);
			
			ctrlCont.appendChild(this.setPos);

			this.element.appendChild(ctrlCont);
		}

		{
			const colCont = doc.createElement('div');
			colCont.classList.add(className('col_cont'));

			this.colorButton = doc.createElement('div');
			this.colorButton.classList.add(className('stop_color_view'));
			
			colCont.appendChild(this.colorButton);

			this.element.appendChild(colCont);
		}

		// Apply the initial value
		this._refresh();

		config.viewProps.handleDispose(() => {
			this._value.emitter.off('change', this._onValueChange.bind(this));
		});
	}

	private _refresh(): void {
		this._idxDisp.innerText = this.stopIdx.rawValue.toString();
		const rawValue = this._value.rawValue;

		const ctx = <CanvasRenderingContext2D>this._canvas.getContext("2d");

		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, 150, 20);

		const gradient = ctx.createLinearGradient(0, 0, 150, 0);

		for (let i = 0; i < rawValue.length; i++) {
			const stop = rawValue[i];

			gradient.addColorStop(stop.stop, (typeof stop.color == 'string' ? stop.color : ((stop.color as ColorRGB).r !== undefined ? `rgb(${(stop.color as ColorRGB).r}, ${(stop.color as ColorRGB).g}, ${(stop.color as ColorRGB).b})` : `hsv(${(stop.color as ColorHSV).h}, ${(stop.color as ColorHSV).s}, ${(stop.color as ColorHSV).v})`)));

			// create little indicator here and set pos
		}

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 150, 20);
	}

	private _onValueChange() {
		this._refresh();
	}
}
