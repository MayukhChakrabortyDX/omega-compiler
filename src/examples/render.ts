import { TodoApp } from "./decorators";

document.querySelector("#app")
    ?.replaceWith((new TodoApp()).render())