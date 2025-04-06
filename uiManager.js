// uiManager.js
import { leagues, currentLeague, getCollectedStickers, getDuplicates, addSticker, switchLeague } from './dataManager.js';


export const stickerGrid = document.querySelector('.sticker-grid');
export const progressDisplay = document.querySelector('.progress');
export const duplicatesList = document.querySelector('.duplicates-list');
export const duplicatesCount = document.querySelector('.duplicates-count');
export const prizeDisplay = document.querySelector('.prize-display');

function createLeagueButtons() {
  const selector = document.querySelector('.album-selector');
  selector.innerHTML = '';

  // Create filter controls
  const filterControls = document.createElement('div');
  filterControls.className = 'filter-controls';

  // Group by options
  const groupBySelect = document.createElement('select');
  groupBySelect.innerHTML = `
    <option value="tier">Group by Tier</option>
    <option value="country">Group by Country</option>
  `;

  filterControls.appendChild(groupBySelect);
  selector.appendChild(filterControls);

  // Create container for league buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';
  selector.appendChild(buttonsContainer);

  // Get search input reference
  const searchInput = document.getElementById('leagueSearch');

  function filterLeagues(searchTerm) {
    // Show/hide buttons based on search term
    const buttons = document.querySelectorAll('.league-button');
    const groups = document.querySelectorAll('.country-group, .tier-group');
    
    groups.forEach(group => {
      let hasVisibleButtons = false;
      
      // Get all buttons in this group
      const groupButtons = group.querySelectorAll('.league-button');
      
      groupButtons.forEach(button => {
        const text = button.textContent.toLowerCase();
        const isMatch = text.includes(searchTerm.toLowerCase());
        button.style.display = isMatch ? 'block' : 'none';
        if (isMatch) hasVisibleButtons = true;
      });
      
      // Show/hide the entire group based on whether it has visible buttons
      group.style.display = hasVisibleButtons ? 'block' : 'none';
    });
  }

  function renderButtons(groupBy = 'country') {
    buttonsContainer.innerHTML = '';
    
    if (groupBy === 'country') {
      // Group leagues by country
      const countriesMap = new Map();
      
      Object.entries(leagues)
      .sort()  
      .forEach(([key, league]) => {
        if (!countriesMap.has(league.country)) {
          countriesMap.set(league.country, []);
        }
        countriesMap.get(league.country).push({ key, ...league });
      });

      // Create country groups
      countriesMap.forEach((countryLeagues, country) => {
        const countryGroup = document.createElement('div');
        countryGroup.className = 'country-group';
        
        const countryHeader = document.createElement('h3');
        countryHeader.textContent = country;
        countryGroup.appendChild(countryHeader);

        countryLeagues.sort((a, b) => {
          const [aTier, aRegion = ''] = a.key.split('_').slice(1);
          const [bTier, bRegion = ''] = b.key.split('_').slice(1);
          return aTier === bTier ? aRegion.localeCompare(bRegion) : Number(aTier) - Number(bTier);
        });

        countryLeagues.forEach(league => {
          const button = createButton(league.key, league);
          countryGroup.appendChild(button);
        });

        buttonsContainer.appendChild(countryGroup);
      });

    } else if (groupBy === 'tier') {
      // Group leagues by tier
      const tiersMap = new Map();
      
      Object.entries(leagues).forEach(([key, league]) => {
        const tier = key.split('_')[1];
        if (!tiersMap.has(tier)) {
          tiersMap.set(tier, []);
        }
        tiersMap.get(tier).push({ key, ...league });
      });

      Array.from(tiersMap.keys())
        .sort((a, b) => Number(a) - Number(b))
        .forEach(tier => {
          const tierGroup = document.createElement('div');
          tierGroup.className = 'tier-group';
          
          const tierHeader = document.createElement('h3');
          tierHeader.textContent = `Tier ${tier}`;
          tierGroup.appendChild(tierHeader);

          tiersMap.get(tier)
            .sort((a, b) => {
              const aRegion = a.key.split('_')[2] || '';
              const bRegion = b.key.split('_')[2] || '';
              return a.country === b.country ? 
                aRegion.localeCompare(bRegion) : 
                a.country.localeCompare(b.country);
            })
            .forEach(league => {
              const button = createButton(league.key, league);
              tierGroup.appendChild(button);
            });

          buttonsContainer.appendChild(tierGroup);
        });
    }

    // Apply current search filter after rendering
    if (searchInput.value) {
      filterLeagues(searchInput.value);
    }
  }

  function createButton(key, league) {
    const button = document.createElement('button');
    button.className = 'league-button';
    
    const region = key.split('_')[2];
    const regionText = region ? ` (Region ${region.toUpperCase()})` : '';
    
    button.textContent = `${league.country} - ${league.name}${regionText}`;
    button.dataset.league = key;
    button.addEventListener('click', () => {
      switchLeague(key);
    });
    
    if (key === currentLeague) {
      button.classList.add('active');
    }
    
    return button;
  }

  // Add event listeners
  groupBySelect.addEventListener('change', (e) => {
    renderButtons(e.target.value);
  });

  searchInput.addEventListener('input', (e) => {
    filterLeagues(e.target.value);
  });

  // Initial render
  renderButtons('tier');
}

function updateProgress() {
  if (!leagues[currentLeague]) return;
  const total = leagues[currentLeague].teams.length;
  const collected = getCollectedStickers().size;
  progressDisplay.textContent = `Collection: ${collected}/${total} teams`;
}

function initializeAlbum() {
  stickerGrid.innerHTML = '';
  // Set all stickers as collected for the current league
  //leagues[currentLeague].teams.forEach(team => {
  //  getCollectedStickers().add(team.id);
  //});

  if (!leagues[currentLeague]) return;

  leagues[currentLeague].teams.forEach(team => {
    const slot = document.createElement('div');
    slot.className = `album-slot ${getCollectedStickers().has(team.id) ? 'filled' : ''}`;
    slot.dataset.teamId = team.id;

    if (getCollectedStickers().has(team.id)) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'sticker-content'; // Add a class for styling
    
      const img = document.createElement('img');
      img.src = team.logo;
      img.alt = team.name; // Keep alt for accessibility
    
      // Create a div to act as the "alt" text (back face)
      const altDiv = document.createElement('div');
      altDiv.className = 'sticker-alt';
      altDiv.textContent = team.name; // Use team.name as the back face content
    
      imgContainer.appendChild(img);
      imgContainer.appendChild(altDiv);
      slot.appendChild(imgContainer);
    } else {
      slot.textContent = '?';
    }

    stickerGrid.appendChild(slot);
  });

  updateProgress();
}

function updateDuplicates() {
  duplicatesList.innerHTML = '';

  Object.entries(getDuplicates()).forEach(([teamId, count]) => {
    if (count > 0) {
      const team = leagues[currentLeague].teams.find(t => t.id === teamId);
      const item = document.createElement('div');
      item.className = 'duplicate-item';
      item.innerHTML = `
        <span>${team.name}</span>
        <span>×${count}</span>
      `;
      duplicatesList.appendChild(item);
    }
  });

  const totalDuplicates = Object.values(getDuplicates()).reduce((sum, count) => sum + count, 0);
  duplicatesCount.textContent = `Duplicates: ${totalDuplicates}`;
}

const animations = ['popIn', 'zoomRotate'];

function getRandomAnimation() {
    return animations[Math.floor(Math.random() * animations.length)];
}

function showPrizeAnimation(teamId, teamName) {
    const prizeAnim = document.createElement('div');
    prizeAnim.className = 'prize-animation';
    
    // Set random animation
    const randomAnim = getRandomAnimation();
    prizeAnim.style.animation = `${randomAnim} 1s ease-out`;
    
    // Create and set up image
    const img = document.createElement('img');
    const team = leagues[currentLeague].teams.find(t => t.id === teamId);
    img.src = team.logo;
    img.alt = teamName;
    img.className = 'prize-image';
    
    prizeAnim.appendChild(img);
    document.body.appendChild(prizeAnim);

    // Remove animation and handle sticker logic after animation ends
    prizeAnim.addEventListener('animationend', () => {
        prizeAnim.remove();
        const result = addSticker(teamId);
        if (result === 'duplicate') {
            prizeDisplay.textContent = `Duplicate ${teamName} sticker!`;
            updateDuplicates();
        } else {
            prizeDisplay.textContent = `New sticker: ${teamName}!`;
            initializeAlbum();
        }
    });
}

export {
  createLeagueButtons,
  initializeAlbum,
  updateProgress,
  updateDuplicates,
  showPrizeAnimation
};