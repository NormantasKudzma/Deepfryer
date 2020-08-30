const templates = document.getElementsByTagName("template");

function triggerReorder(panel) {
	if (panel.onreorder){
		panel.onreorder(panel.querySelectorAll('div.inline_container'));
	}
}

function setupShaderPanel(panel){
	let selected = void 0;
	
	const isMovable = (elem) => { return elem.classList.contains('move_icon'); };
	const selectorDiv = (elem) => {
		let p = elem;
		while (p.parentElement != panel) {
			p = p.parentElement;
		}
		return p;
	};
	
	const dragEnd = (e) => {
		panel.onmousemove = void 0;
		panel.onmouseup = void 0;
		panel.onmouseleave = void 0;
		selected = void 0;
	};
	
	const dragMove = (e) => {
		e = e || window.event;
		e.preventDefault();
		
		if (e.target == panel) { return; }
		const targetRoot = selectorDiv(e.target);
		
		if (e.target == selected || targetRoot == selected) { return; }
		const isAbove = selected.offsetTop > targetRoot.offsetTop;
		
		panel.removeChild(selected);
		if (isAbove){ panel.insertBefore(selected, targetRoot); }
		else { panel.insertBefore(selected, targetRoot.nextSibling); }
		
		triggerReorder(panel);
	};
	
	panel.onmousedown = (e) => {
		if (!isMovable(e.target)) { return; }
		e = e || window.event;
		e.preventDefault();
		panel.onmousemove = dragMove
		panel.onmouseup = dragEnd;
		panel.onmouseleave = dragEnd;
		selected = selectorDiv(e.target);
	};
}

function setupDropdownPanel(panel, items){
	const dropdownDiv = document.getElementById("pipeline_dropdown");
	const addButton = document.getElementById("add_button");
	const showClass = "dropdown_show";
	
	addButton.onclick = () => {
		if (!dropdownDiv.classList.contains(showClass)){
			dropdownDiv.classList.add(showClass);
		}
	};
	
	const hideDropdown = () => {
		if (dropdownDiv.classList.contains(showClass)){
			dropdownDiv.classList.remove(showClass);
		}
	};
	panel.onmouseleave = hideDropdown;
	
	const dropdownItemTemplate = templates[2];
	Object.keys(items).forEach(k => {
		let btn = dropdownItemTemplate.content.cloneNode(true).querySelector('div');
		btn.innerText = k;
		btn.onclick = async () => {
			hideDropdown();
			await items[k](k);
			if (panel.onadded) {
				panel.onadded(k);
			}
		};
		dropdownDiv.appendChild(btn);
	});
}

function insertToShaderPanel(panel, selector){
	panel.appendChild(selector.root);
	selector.delete.onclick = () => {
		panel.removeChild(selector.root);
		triggerReorder(panel);
	};
}

function createShaderDiv(title){
	const shaderSelectTemplate = templates[0];
	const div = shaderSelectTemplate.content.cloneNode(true).querySelector('div');
	const icons = div.querySelectorAll('img');
	const sliders = div.querySelector('div');
	sliders.textContent = title;
	return {
		root: div,
		sliders: sliders,
		move: icons[0],
		delete: icons[1],
	};
}

function createSlider(min, max, value, callback){
	const sliderTemplate = templates[1];
	const slider = sliderTemplate.content.cloneNode(true).querySelector('input');
	slider.min = min;
	slider.max = max;
	slider.value = value;
	slider.onchange = callback;
	return slider;
}
