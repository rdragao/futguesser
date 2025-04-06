// main.js

import { currentLeague, initializeCollections, switchLeague } from './dataManager.js';
import { createLeagueButtons, initializeAlbum } from './uiManager.js';
import { resetGame } from './gameLogic.js';

function initializeGame() {
  initializeCollections();
  switchLeague(currentLeague);
  createLeagueButtons();
  initializeAlbum();
  resetGame();
}


initializeGame();