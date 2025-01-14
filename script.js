let players = [];
let matches = [];

// Initialize from localStorage if available
function initializeData() {
    const savedPlayers = localStorage.getItem('gamePlayers');
    const savedMatches = localStorage.getItem('gameMatches');
    
    players = savedPlayers ? JSON.parse(savedPlayers) : [];
    matches = savedMatches ? JSON.parse(savedMatches) : [];
    
    updateUI();
    updateHistory();
    updateFilterOptions();
}

function resetDatabase() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.clear();
        players = [];
        matches = [];
        updateUI();
        updateHistory();
        updateFilterOptions();
    }
}

function updateFilterOptions() {
    const filterPlayer = document.getElementById('filterPlayer');
    filterPlayer.innerHTML = '<option value="">All Players</option>' +
        players.map(player => `
            <option value="${player.name}">${player.name}</option>
        `).join('');
}

function applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const gameType = document.getElementById('filterGameType').value;
    const player = document.getElementById('filterPlayer').value;

    let filteredMatches = [...matches];

    // Date range filter
    if (startDate) {
        filteredMatches = filteredMatches.filter(match => 
            match.date >= startDate
        );
    }
    if (endDate) {
        filteredMatches = filteredMatches.filter(match => 
            match.date <= endDate
        );
    }

    // Game type filter
    if (gameType) {
        filteredMatches = filteredMatches.filter(match => 
            match.gameType === gameType
        );
    }

    // Player filter
    if (player) {
        filteredMatches = filteredMatches.filter(match => 
            match.players.includes(player) ||
            match.winner === player ||
            match.worstPerformer === player
        );
    }

    updateHistoryTable(filteredMatches);
}

function clearFilters() {
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('filterGameType').value = '';
    document.getElementById('filterPlayer').value = '';
    updateHistory();
}

function formatDate(dateString) {
    // Make sure we have a valid date string
    if (!dateString) return '';
    
    try {
        // Create a new date object using the input date string
        // Add time to ensure consistent timezone handling
        const date = new Date(dateString + 'T00:00:00');
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }

        // Format the date
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        
        return date.toLocaleDateString(undefined, options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // Return original if there's an error
    }
}

function showAddPlayerForm() {
    const name = prompt('Enter player name:');
    if (name && name.trim() !== '') {
        const newPlayer = {
            id: Date.now(),  // Ensure unique ID
            name: name.trim(),
            games: 0,
            victories: 0,
            worstPerformer: 0,
            winRate: '0.00%'
        };
        
        players.push(newPlayer);
        saveData();
        updateUI();
        updateFilterOptions();
    }
}

function removePlayer(id) {
    if (confirm('Are you sure you want to remove this player?')) {
        console.log('Removing player with ID:', id);
        players = players.filter(player => player.id !== id);
        saveData();
        updateUI();
        updateHistory();
        updateFilterOptions();
    }
}

function calculateWinRate(victories, games) {
    if (games === 0) return '0.00%';
    return ((victories / games) * 100).toFixed(2) + '%';
}

function recordGame() {
    const dateInput = document.getElementById('gameDate').value;
    const gameType = document.getElementById('gameType').value;
    const winner = document.getElementById('winnerSelect').value;
    const worstPerformer = document.getElementById('worstPerformerSelect').value;
    
    // Validation
    if (!dateInput || !gameType || !winner || !worstPerformer) {
        alert('Please fill in all fields');
        return;
    }

    // Get selected players
    const selectedPlayers = Array.from(document.querySelectorAll('input[name="playerCheckbox"]:checked'))
        .map(cb => cb.value);

    if (selectedPlayers.length < 2) {
        alert('Please select at least 2 players');
        return;
    }

    // Get player names for the match record
    const playerNames = selectedPlayers.map(id => {
        const player = players.find(p => p.id.toString() === id);
        return player.name;
    });

    const winnerName = players.find(p => p.id.toString() === winner).name;
    const worstPerformerName = players.find(p => p.id.toString() === worstPerformer).name;

    // Create match record with exact date from input
    const match = {
        id: Date.now(),
        date: dateInput,
        gameType,
        players: playerNames,
        winner: winnerName,
        worstPerformer: worstPerformerName
    };

    // Add to matches array
    matches.push(match);
    console.log('New match recorded:', match);

    // Update player stats
    players = players.map(player => {
        if (selectedPlayers.includes(player.id.toString())) {
            const newGames = player.games + 1;
            const newVictories = player.id.toString() === winner ? player.victories + 1 : player.victories;
            const newWorstPerformer = player.id.toString() === worstPerformer ? 
                player.worstPerformer + 1 : player.worstPerformer;

            return {
                ...player,
                games: newGames,
                victories: newVictories,
                worstPerformer: newWorstPerformer,
                winRate: calculateWinRate(newVictories, newGames)
            };
        }
        return player;
    });

    // Save all data
    saveData();
    
    // Update UI
    updateUI();
    updateHistory();
    
    // Reset form
    resetGameForm();
    
    // Confirm to user
    alert('Game successfully recorded!');
}

function updateHistoryTable(matchesToShow) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    // Sort matches by date (newest first)
    const sortedMatches = [...(matchesToShow || matches)].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedMatches.forEach(match => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(match.date)}</td>
            <td>${match.gameType}</td>
            <td>${match.players.join(', ')}</td>
            <td>${match.winner}</td>
            <td>${match.worstPerformer}</td>
        `;
        tbody.appendChild(row);
    });
}

function saveData() {
    localStorage.setItem('gamePlayers', JSON.stringify(players));
    localStorage.setItem('gameMatches', JSON.stringify(matches));
}

function updateUI() {
    // Sort players by win rate
    players.sort((a, b) => {
        const aRate = parseFloat(a.winRate);
        const bRate = parseFloat(b.winRate);
        return bRate - aRate;
    });

    // Update player table
    const tbody = document.getElementById('playerTableBody');
    tbody.innerHTML = '';
    
    players.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.games}</td>
            <td>${player.victories}</td>
            <td>${player.worstPerformer}</td>
            <td>${player.winRate}</td>
            <td>
                <button class="button button-red" onclick="removePlayer(${player.id})">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Update player selection checkboxes
    const playerSelection = document.getElementById('playerSelection');
    if (playerSelection) {
        playerSelection.innerHTML = players.map(player => `
            <div>
                <input type="checkbox" name="playerCheckbox" value="${player.id}" id="player${player.id}">
                <label for="player${player.id}">${player.name}</label>
            </div>
        `).join('');
    }

    // Update winner and worst performer selects
    const winnerSelect = document.getElementById('winnerSelect');
    const worstPerformerSelect = document.getElementById('worstPerformerSelect');
    
    const playerOptions = `
        <option value="">Select player...</option>
        ${players.map(player => `
            <option value="${player.id}">${player.name}</option>
        `).join('')}
    `;
    
    if (winnerSelect) winnerSelect.innerHTML = playerOptions;
    if (worstPerformerSelect) worstPerformerSelect.innerHTML = playerOptions;
}

function resetGameForm() {
    document.getElementById('gameDate').value = '';
    document.getElementById('gameType').value = '';
    document.querySelectorAll('input[name="playerCheckbox"]').forEach(cb => cb.checked = false);
    document.getElementById('winnerSelect').value = '';
    document.getElementById('worstPerformerSelect').value = '';
}

function updateHistory() {
    updateHistoryTable(matches);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeData);

// Add this debugging function to help verify data
function checkDataStatus() {
    console.log('Current players:', players);
    console.log('Current matches:', matches);
    console.log('LocalStorage players:', localStorage.getItem('gamePlayers'));
    console.log('LocalStorage matches:', localStorage.getItem('gameMatches'));
}
