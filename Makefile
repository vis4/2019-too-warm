publish:
	npm run build
	cp public/build/* ~/projects/vis4net/source/interactives/2019-too-warm/build
	cp -R public/data/* ~/projects/vis4net/source/interactives/2019-too-warm/data
	touch ~/projects/vis4net/source/_posts/2002-too-warm.md

update-data:
	cd ../r-work && Rscript update.R

deploy:
	cd ~/projects/vis4net && npm run deploy

update: update-data publish deploy
