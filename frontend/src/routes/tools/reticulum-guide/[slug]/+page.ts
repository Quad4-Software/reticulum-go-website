import { error } from '@sveltejs/kit';
import { getTutorial } from '$lib/tutorials';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const tutorial = getTutorial(params.slug);
	if (!tutorial) {
		error(404, 'Tutorial not found');
	}
	return { tutorial };
};
