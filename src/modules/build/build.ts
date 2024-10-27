function buildProject(start: string) {
    
    Bun.build({
        outdir: "./dist",
        entrypoints: [start],
        plugins: []
    })

}