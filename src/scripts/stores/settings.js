import flux   from '../utils/flux';
import Action from '../actions';
import Translations from '../translations';
/**
 *
 */
export default flux.store({
	getSetting(name) {
		if(name !== 'locale')
			return localStorage.getItem(name);

		else if(name == 'locale' && localStorage.getItem(name))
			return Translations[localStorage.getItem(name)];

		else if(name === 'locale'){
			let match=false;
			for (var language in Translations) {
				console.log(language + ' ' + window.navigator.language)
				if(language === window.navigator.language)
					match=true;
			}
			return !match ? Translations['ru'] : Translations[window.navigator.language]
		}
	},
	handlers: {
		[Action.Settings.Edit](payload) {
			localStorage.setItem(payload.key, payload.value);
		},
	}
});
