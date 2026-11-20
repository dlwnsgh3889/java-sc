function showMeal(mealKey) {
  const meal = window.CampusData.meals[mealKey];
  const panel = document.querySelector('#mealPanel');
  panel.innerHTML = `<strong>${meal.title}</strong><p>${meal.main}</p><p>반찬: ${meal.side}</p>`;
  document.querySelectorAll('.meal-tab').forEach((button) => button.classList.toggle('active', button.dataset.meal === mealKey));
}

function initializeMealMenu() {
  document.querySelectorAll('.meal-tab').forEach((button) => button.addEventListener('click', () => showMeal(button.dataset.meal)));
  showMeal('breakfast');
}

window.CampusFeatures = window.CampusFeatures || {};
window.CampusFeatures.initializeMealMenu = initializeMealMenu;