// content.js

window.addEventListener('load', () => {
    clear_mark();
    markPastDates_month();
    markPastDates_year();
    initializeMutationObserver();
});

function getDate(dateKey) {
    const numericDateKey = parseInt(dateKey, 10); 
    
    if (isNaN(numericDateKey)) {

        return null;
    }

    const yearOffset = (numericDateKey - 32) % 512;
    const year = (numericDateKey - 32 - yearOffset) / 512;
    const day = yearOffset % 32;
    const month = (yearOffset - day) / 32; // 月份在 Date 物件中是 0-11

    if (isNaN(year) || isNaN(month) || isNaN(day) || year < 0 || month < 0 || month > 11 || day < 1 || day > 31) {
        console.error(`getDate：年=${year}, 月=${month}, 日=${day} (原始 key: ${dateKey})`);
        return null;
    }

    return new Date(year + 1970, month, day);
}

function initializeMutationObserver() {
    let timeoutId_1 = null; 
    let timeoutId_2 = null; 
    /* Monitor all bot change,  
    childList : listen child node change(add or remove)
    subtree: listen all sub node
    attributes: no need listen property change, increase performance 
    No idea why some time will be cleaned, we have to draw lot of time
    */

    observer = new MutationObserver((mutationsList, observer) => {
        /* Every DOM change trigger markPastDates but use debounce avoid jitter*/
        clearTimeout(timeoutId_1);
        timeoutId_1 = setTimeout(() => {
            clear_mark();
            markPastDates_month(500);
            markPastDates_year(500);
        }, 500); /* Let calendar do some update first. */
    })

    observer.observe(document.querySelector('body'), { childList: true, subtree: false, attributes: true });
    elementsWithDataKey = document.querySelectorAll('div[tabindex="-1"]')
    elementsWithDataKey.forEach(element => {
        observer.observe(element, { childList: true, subtree: false, attributes: true });
    });

    observer = new MutationObserver((mutationsList, observer) => {
        /* Every DOM change trigger markPastDates but use debounce avoid jitter*/
        clearTimeout(timeoutId_2);
        timeoutId_2 = setTimeout(() => {
            clear_mark();
            markPastDates_month(2000);
            markPastDates_year(2000);
        }, 2000); /* Let calendar do some update first. */
    });
    observer.observe(document.querySelector('body'), { childList: true, subtree: false, attributes: true });
}

function clear_mark(){
    const currentPath = window.location.pathname;
    if ((!currentPath.includes('/r/month') ) & (!currentPath.includes('/r/year'))) {
        // console.log("current path : ", currentPath);
        document.querySelectorAll('.red-cross-overlay').forEach(el => el.remove());
        document.querySelectorAll('.green-circle-overlay').forEach(el => el.remove());
        document.querySelectorAll('.past-date-crossed').forEach(cell => {
            cell.classList.remove('past-date-crossed');
            if (cell.dataset.marked) delete cell.dataset.marked;
            if (cell.style.position === 'relative' || cell.style.position === 'absolute') cell.style.position = '';
        });
        return;
    }
}

function markPastDates_year(t) {
	const currentPath = window.location.pathname;
    if (!currentPath.includes('/r/year')) {
        return;
    }
    // console.log("markPastDates_year", t,"========================");
    const dateCells = document.querySelectorAll('td[data-date]');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 將時間設為午夜，方便日期比較

    let markedCount = 0;

    dateCells.forEach(cell => {
        if (cell.querySelector('.red-cross-overlay') | cell.querySelector('.past-date-crossed') ) return;

        const dataDate = cell.getAttribute('data-date'); // 格式 YYYYMMDD
        if (!dataDate || dataDate.length !== 8) {
        return;
        }

        // 將 YYYYMMDD 格式轉換為 Date 物件
        const year = parseInt(dataDate.substring(0, 4), 10);
        const month = parseInt(dataDate.substring(4, 6), 10) - 1; // 月份是 0-11
        const day = parseInt(dataDate.substring(6, 8), 10);

        const cellDate = new Date(year, month, day);

        if (cellDate < today) {
        cell.classList.add('past-date-crossed');
        if (window.getComputedStyle(cell).position === 'static') cell.style.position = 'relative';

        cell.appendChild(add_red_cross());
        markedCount++;
        }
    });
}

function markPastDates_month(t) {
	const currentPath = window.location.pathname;
    if (!currentPath.includes('/r/month')) {
        return;
    }
    // console.log("markPastDates_month", t, "========================");
    /* Every we add cross, we clean previous red cross */
    const existingCrosses = document.querySelectorAll('.red-cross-overlay');
    existingCrosses.forEach(cross => cross.remove());

    /* Find <div> which has data-datekey property */
    const dateCellsWithKey = document.querySelectorAll('div[data-datekey]');

    if (dateCellsWithKey.length === 0) {
        return;
    }
    /* Make 'today's time as mid night fo easy compare, not necessary */
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    currentDisplayYear = today.getFullYear();
    currentDisplayMonth = today.getMonth();
    let nextMonthYear = currentDisplayYear;
    let nextMonthMonth = currentDisplayMonth + 1;
    if (nextMonthMonth > 11) {
        nextMonthMonth = 0; // 1 月 (0-indexed)
        nextMonthYear++;
    }

    dateCellsWithKey.forEach(cell => {
        if (cell.querySelector('.red-cross-overlay') | cell.querySelector('.past-date-crossed') ) return;
        const dataDateKey = cell.getAttribute('data-datekey');
        let cellDate = getDate(dataDateKey); 

        if (!cellDate) { 
            return; 
        }
        if (cellDate < today) {
            // console.log(`This is pass day： ${cellDate.toDateString()}`);
            /* Add element to css*/
            /* Make sure parent element has position: relative, avoid absolute position fail */
            /* Only do when element don't have position property, avoid cover google style */

            if (window.getComputedStyle(cell).position === 'static') {
                cell.style.position = 'relative';
            }

            cell.appendChild(add_red_cross());
            //cell.appendChild(add_svg_cross());
            cell.dataset.marked = 'true';
        }else if(
        	cellDate.getFullYear() === nextMonthYear && cellDate.getMonth() === nextMonthMonth){
        	
        	cell.classList.add('next-month-marked');
        	if (window.getComputedStyle(cell).position === 'static') {
                cell.style.position = 'relative';
            }
            // cell.appendChild(add_green_circle());
        }
    });
}

function add_svg_cross(){
    /* Create svg red cross */
    let crossElement = document.createElement('div');
    crossElement.className = 'red-cross-overlay';
    crossElement.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="10" y1="10" x2="90" y2="90" stroke="red" stroke-width="8"/>
            <line x1="90" y1="10" x2="10" y2="90" stroke="red" stroke-width="8"/>
        </svg>
    `;
    return crossElement;
}

function add_red_cross(){
    let crossImg = document.createElement('img');
    crossImg.className = 'red-cross-overlay';
    crossImg.src = chrome.runtime.getURL('images/red_cross.png'); 
	crossImg.style.position = 'absolute';
	crossImg.style.top = '50%';
	crossImg.style.left = '50%';
	crossImg.style.transform = 'translate(-50%, -50%)'; /* Put in middle */
	crossImg.style.width = '100%'; 
	crossImg.style.height = '100%'; 
	crossImg.style.objectFit = 'contain'; /* Make sure pic show*/
	crossImg.style.pointerEvents = 'none'; /* Avoid pic catch click event */
	
	return crossImg;
}

function add_green_circle(){
    let crossImg = document.createElement('img');
    crossImg.className = 'green-circle-overlay';
    crossImg.src = chrome.runtime.getURL('images/green_circle.png'); 
	crossImg.style.position = 'absolute';
	crossImg.style.top = '50%';
	crossImg.style.left = '50%';
	crossImg.style.transform = 'translate(-50%, -50%)'; /* Put in middle */
	crossImg.style.width = '100%'; 
	crossImg.style.height = '100%'; 
	crossImg.style.objectFit = 'contain'; /* Make sure pic show*/
	crossImg.style.pointerEvents = 'none'; /* Avoid pic catch click event */
	crossImg.style.opacity = '0.01';
	return crossImg;
}
