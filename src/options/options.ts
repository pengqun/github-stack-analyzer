import { CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/constants';

export interface GSASettings {
  showBadge: boolean;
  minConfidence: number;
  enabledCategories: string[];
}

const DEFAULT_SETTINGS: GSASettings = {
  showBadge: true,
  minConfidence: 0,
  enabledCategories: [...CATEGORY_ORDER],
};

const showBadgeEl = document.getElementById('show-badge') as HTMLInputElement;
const minConfidenceEl = document.getElementById('min-confidence') as HTMLSelectElement;
const categoriesGridEl = document.getElementById('categories-grid')!;
const saveBtnEl = document.getElementById('save-btn')!;
const saveStatusEl = document.getElementById('save-status')!;

function renderCategories(enabledCategories: string[]) {
  let html = '';
  for (const category of CATEGORY_ORDER) {
    const label = CATEGORY_LABELS[category] || category;
    const checked = enabledCategories.includes(category) ? 'checked' : '';
    html += `
      <div class="category-option">
        <input type="checkbox" id="cat-${category}" value="${category}" ${checked}>
        <label for="cat-${category}">${label}</label>
      </div>
    `;
  }
  categoriesGridEl.innerHTML = html;
}

async function loadSettings(): Promise<GSASettings> {
  try {
    const data = await chrome.storage.sync.get('gsaSettings');
    if (data.gsaSettings) {
      return { ...DEFAULT_SETTINGS, ...data.gsaSettings };
    }
  } catch {
    // Storage may be unavailable
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(): Promise<void> {
  const enabledCategories: string[] = [];
  categoriesGridEl.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const checkbox = input as HTMLInputElement;
    if (checkbox.checked) {
      enabledCategories.push(checkbox.value);
    }
  });

  const settings: GSASettings = {
    showBadge: showBadgeEl.checked,
    minConfidence: parseInt(minConfidenceEl.value, 10),
    enabledCategories,
  };

  try {
    await chrome.storage.sync.set({ gsaSettings: settings });
    saveStatusEl.classList.remove('hidden');
    setTimeout(() => saveStatusEl.classList.add('hidden'), 2000);
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

async function init() {
  const settings = await loadSettings();

  showBadgeEl.checked = settings.showBadge;
  minConfidenceEl.value = String(settings.minConfidence);
  renderCategories(settings.enabledCategories);

  saveBtnEl.addEventListener('click', saveSettings);
}

init();
