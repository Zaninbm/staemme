// ==UserScript==
// @name         Farm Script
// @namespace    http://tampermonkey.net/
// @version      1.2.3
// @description  Farms selected villages.
// @author       You
// @match        https://*.die-staemme.de/game.php*screen=map*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=die-staemme.de
// @grant        none
// ==/UserScript==




/*
Interessante Variablen:

TWMap
TWMap.villages


*/



(function () {
    'use strict';

    const contentValue = document.querySelector('#content_value');


    let ptr = 0;
    let interval = null;
    let attackExecuted = true;
    
    function getNextTarget() {
    
        let TargetBBCodes = targets.value.split('\n').filter((line) => line !== '');
        if (TargetBBCodes.length === 0) {
            return null;
        }
    
        ptr = ptr % TargetBBCodes.length;
    
        const BBCode = TargetBBCodes[ptr];

        ptr++;
    
        return BBCode;
    }
    
    function getSelectedTemplate() {
        return selectTemplate.value
    }
    
    
    function checkIfTroopsAreAvailable() {
        /*
            {
                "spear": "1287",
                "sword": "213",
                "axe": "0",
                "archer": "0",
                "spy": "0",
                "light": "0",
                "marcher": "0",
                "heavy": "50",
                "ram": "0",
                "catapult": "0",
                "knight": "1",
                "snob": "0"
            }
        */
        const selectedTemplateId = getSelectedTemplate();
        const selectedTemplate = TroopTemplates.current[selectedTemplateId]
        for(const [k,v] of Object.entries(selectedTemplate)) {
           

            if(!(game_data.units.find((e) => e == k)))
                continue;
            
            const units = document.getElementById(`units_entry_all_${k}`)?.innerHTML.match(/\d+/)[0]
            const requriedUnits = parseInt(v);
            if(units < requriedUnits) {
                console.log("not enough troops", k, v, "have", units);
                return false;
            }
        }
    
        
    
        return true
    
    
    }
    
    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
    
    async function startFarming() {
        console.log("start farming");
        interval = setInterval(async () => {
            // if the last attack was not executed dont continue to next target
            if(!attackExecuted)
            return;
            
            
            try {
                        
                attackExecuted = false;
                console.log("checking for next target");
                const target = getNextTarget();
                console.log("next target", target);
        
                if (target === null || target === '') {
                    return;
                }
        
                // target village is passed like x|y
                // village ids are stored in TWMAP.villages where xy is key
                // id like "32310"
                let xy = target.match(/\d+\|\d+/)[0].split('|').join('');
                let e = TWMap.villages[xy].id;
                CommandPopup.openRallyPoint({
                    target: e
                })
            
                // waiting templates to be loaded
                // there are also troop templates in TWMap.troop_templates
                while (!TroopTemplates.current) {
                    console.log("waiting for troop templates to be loaded");
                    await sleep(300);
                }
        
                if (!checkIfTroopsAreAvailable()) {
                    console.log("not enough troops, check after next udpate");
                    await sleep(3000 + Math.random() * 1000);
                    return;
                }
        
                // popup should open
                // now select template
                let template = getSelectedTemplate();
                TroopTemplates.useTemplate(template);
        
        
                document.getElementById('target_attack').click();
                
                let waitCycle = 0;
                while (!document.getElementById('troop_confirm_submit')) {
                    
                    console.log("waiting for troop_confirm_submit");
                    await sleep(100);
                    if(waitCycle++ > 3) {
                        console.log("waited too long for troop_confirm_submit");
                        return;
                    }
                }
        
                document.getElementById('troop_confirm_submit').click();
                
            } finally {
                attackExecuted = true;
            }
    
        }, 3000);
    }
    
    function stopFarming() {
        if (interval !== null) {
            clearInterval(interval);
        }
    
    }

    document.onkeyup = function (e) {
        e.key === 'Escape' && stopFarming();
    }
    const containerDiv = document.createElement('div');
    containerDiv.style = 'display: flex; flex-direction: column; align-items: flex-start;';

    //heading
    const heading = document.createElement('h2');
    heading.textContent = 'Paste BB Code to Farm villages:';

    // adding text area to conent value
    const targets = document.createElement('textArea');
    targets.id = 'TargetBBCodes';


    // get troop tampelates
    const templates = document.querySelector('#troop_template_selection').innerHTML;

    // select template option
    const selectTemplate = document.createElement('select');
    selectTemplate.id = 'selectTemplate';
    selectTemplate.innerHTML = templates;


    // toggle button start/stop farming
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggleButton';
    toggleButton.textContent = 'Start Farming';
    toggleButton.onclick = () => {
        if (toggleButton.textContent === 'Start Farming') {
            toggleButton.textContent = 'Stop Farming';
            startFarming();
        } else {
            toggleButton.textContent = 'Start Farming';
            stopFarming();
        }
    }


    // adding heading and text area to content value



    containerDiv.appendChild(heading);
    containerDiv.appendChild(targets);
    containerDiv.appendChild(selectTemplate);
    containerDiv.appendChild(toggleButton);
    contentValue.appendChild(containerDiv);

    window.checkIfTroopsAreAvailable = checkIfTroopsAreAvailable;
    window.startFarming = startFarming;
    window.stopFarming = stopFarming;
    window.getNextTarget = getNextTarget;
    window.getSelectedTemplate = getSelectedTemplate;

})();