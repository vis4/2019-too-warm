# 2019-too-warm

This repo contains the sources for this article https://www.vis4.net/blog/2020/01/2019-too-warm/ 

`r-work` contains the R scripts I used to download and clean the raw data from DWD. 

To update the data run

```bash
cd r-work/
Rscript update.R
```

`app` contains the Svelte web app and the charts.

This is how you can run the app locally

```bash
cd app/
npm run dev
```

[discuss on reddit](https://www.reddit.com/r/dataisbeautiful/comments/ejfra9/oc_someone_argued_with_me_if_this_winter_was/)
