/**
 * Configuration file for readme-to-html
 * Generated with the --init command
 */
export default {
  // Use a remote template (no need to create your own)
  templatePath: "https://raw.githubusercontent.com/rvanbaalen/rvanbaalen.github.io/refs/heads/main/templates/project-template.html",
  
  // Custom stylesheet (optional)
  stylesheetPath: "https://raw.githubusercontent.com/rvanbaalen/rvanbaalen.github.io/refs/heads/main/templates/style.css",
  
  // Fix unreplaced template variables and incorrect socialify project reference
  replace: {
    // Replace unreplaced OG meta tag placeholders with correct values
    "content=\"{{OG_IMAGE}}\"": "content=\"https://socialify.git.ci/rvanbaalen/runner-manager/image?language=1&name=1&owner=1&pattern=Charlie+Brown&theme=Light\"",
    "content=\"{{OG_IMAGE_WIDTH}}\"": "content=\"1280\"",
    "content=\"{{OG_IMAGE_HEIGHT}}\"": "content=\"640\"",
    "content=\"{{FULL_URL}}\"": "content=\"https://runner-manager.robinvanbaalen.nl/\"",
    "href=\"{{FULL_URL}}\"": "href=\"https://runner-manager.robinvanbaalen.nl/\"",
    // Fix hardcoded socialify URL that references the wrong project (readme-to-html)
    "rvanbaalen/readme-to-html/image": "rvanbaalen/runner-manager/image",
    // Fix "All my projects" link to point to the main portfolio site
    "href=\"/\" class=\"hover:text-white/80 transition px-2 py-1\">&larr; All my projects": "href=\"https://robinvanbaalen.nl\" class=\"hover:text-white/80 transition px-2 py-1\">&larr; All my projects",
    // Fix footer copyright link
    "href=\"/\" class=\"hover:text-sky-300 transition\">©": "href=\"https://robinvanbaalen.nl\" class=\"hover:text-sky-300 transition\">©",
  },
}
