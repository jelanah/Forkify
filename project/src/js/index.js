
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';



/** Global State of the app
 * - Search Object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */ 

const state = {};
window.state=state;
/**
 *  SEARCH CONTROLLER
 */
const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput();
   
    
    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes)
       
        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on the UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) { 
            alert('Oops! Something went wrong.');
            clearLoader();
        }

    }
}
    
// When form is submitted
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        console.log(goToPage);
    }
});



/**
 *  RECIPE CONTROLLER
 */

const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#','');
    console.log(id);

    
    if (id) {

    // Prepare the UI for changes 
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    

    // Highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    // Create new recipe object
    state.recipe = new Recipe(id);
 
    try {
        // Get recipe data
        await state.recipe.getRecipe();
        console.log(state.recipe.ingredients);
        state.recipe.parseIngredients();
    
        // calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();
    
        // Render recipe

        clearLoader();
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id)
            );
        console.log(state.recipe);

        } catch (error) {
            console.log(error);
            alert('Error processing recipe!');
        }

    }
};


// Recipe is clicked from search results or the page is loaded with a recipe hash ID in the url
['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe));

/**
 *  LIST CONTROLLER
 */

 // Create a new list if there is no list yet
 const controlList = () => {

     if (!state.list) state.list = new List();
     
     // Add each ingredient to the list and UI
     state.recipe.ingredients.forEach( el => {
         const item = state.list.addItem(el.count, el.unit, el.ingredient);
         listView.renderItem(item);
        });

};


// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
        
    }
});


/**
 *  LIKE CONTROLLER
 */

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
        // Add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title, 
            state.recipe.author, 
            state.recipe.img
        );

        // Toggle button
        likesView.toggleLikeBtn(true);
            
        // Add like to UI
        likesView.renderLike(newLike);
        

    // User has NOT yet liked current recipe
    } else {
        // Remove like to state
        state.likes.deleteLike(currentID);

        // Toggle button
        likesView.toggleLikeBtn(false);

        // Remove like from UI
        likesView.deleteLike(id);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());

}

 /**
 *  WINDOW 
 */

 // Restore liked recipes when pages loads 
 window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));


 });

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings >1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }

    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();

    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller 
        controlLike();
    }

});


