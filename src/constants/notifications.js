const TIME_WINDOWS = {
    cookingMorning: { start: 9, end: 13 },
    cookingNight: { start: 20, end: 23 },
    dishMorning: { start: 9, end: 12 },
    dishNight: { start: 19, end: 22 },
};

const CATEGORY_GROCERIES = 'groceries';
const CATEGORY_VEGETABLES = 'vegetables';

const INITIAL_EXPECTED_AMOUNTS = {
    [CATEGORY_GROCERIES]: 1000,
    [CATEGORY_VEGETABLES]: 500,
};

export {
    TIME_WINDOWS,
    CATEGORY_GROCERIES,
    CATEGORY_VEGETABLES,
    INITIAL_EXPECTED_AMOUNTS,
};
