/* FOOTER & INTERACTION BUNDLE */


document.addEventListener("DOMContentLoaded", function() {
    
    // 1. INJECT NAVIGATION (Using absolute paths for GitHub Pages)
    const navPlaceholder = document.querySelector('.navbar');
    if (navPlaceholder) {
        const root = "https://sameheltaybani.github.io/my-website/";
        const currentPage = window.location.pathname.split("/").pop() || "index.html";

        navPlaceholder.innerHTML = `
            <div class="text-white font-bold w-full text-center md:w-auto md:text-left md:mr-10" style="font-size:16px; letter-spacing:-0.5px; padding-bottom:10px; md:padding-bottom:0;">
                DR. SAMEH ELTAYBANI
            </div>
            <div class="nav-links" style="display: flex; flex-wrap: wrap; justify-content: center;">
                <a href="${root}index.html" class="nav-item ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Home</a>
                <a href="${root}pages/research/research.html" class="nav-item ${currentPage === 'research.html' ? 'active' : ''}">Research</a>
                <a href="${root}pages/publications/publications.html" class="nav-item ${currentPage === 'publications.html' ? 'active' : ''}">Publications</a>
                <a href="${root}pages/data-analysis/data-analysis.html" class="nav-item ${currentPage === 'data-analysis.html' ? 'active' : ''}">Data Analysis</a>
                <a href="${root}pages/teaching/teaching.html" class="nav-item ${currentPage === 'teaching.html' ? 'active' : ''}">Teaching</a>
                <a href="${root}pages/blog/blog.html" class="nav-item ${currentPage === 'blog.html' ? 'active' : ''}">Blog</a>
                <a href="${root}pages/contact/contact.html" class="nav-item ${currentPage === 'contact.html' ? 'active' : ''}">Contact</a>
            </div>
        `;
    }

    // 2. INJECT FOOTER (Using same root logic)
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        const root = "https://sameheltaybani.github.io/my-website/";
        footerPlaceholder.innerHTML = `
        <footer class="site-footer">
            <div style="display:grid; grid-template-columns: 1fr 2fr; gap:60px; max-width:1000px; margin:0 auto;">
                <div>
                    <h4 style="color:var(--amber); font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:20px;">Site Map</h4>
                    <a href="${root}index.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Home</a>
                    <a href="${root}pages/research/research.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Research</a>
                    <a href="${root}pages/publications/publications.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Publications</a>
                    <a href="${root}pages/data-analysis/data-analysis.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Data Analysis</a>
                    <a href="${root}pages/teaching/teaching.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Teaching</a>
                    <a href="${root}pages/blog/blog.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Blog</a>
                    <a href="${root}pages/contact/contact.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Contact</a>
                </div>
                <div>
                    <h4 style="color:var(--amber); font-size:11px; font-weight:800; text-transform:uppercase; margin-bottom:20px;">Professional Disclaimer</h4>
                    <p style="font-size:13px; line-height:1.8; color:rgba(255,255,255,0.6); text-align:justify;">
                        The content and research presented on this website are for informational purposes only. All views, opinions, and data interpretations expressed herein are exclusively my own.
                    </p>
                </div>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:40px; padding-top:20px; text-align:center; font-size:10px; opacity:0.4; letter-spacing:0.2em;">
                © 2026 SAMEH ELTAYBANI. ALL RIGHTS RESERVED.
            </div>
            <a href="#" id="backToTop" style="display:none; text-decoration:none;">↑</a>
        </footer>`;
    }

    // 3. BACK TO TOP LOGIC
    const topBtn = document.getElementById("backToTop");
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            topBtn.style.display = "flex";
        } else {
            topBtn.style.display = "none";
        }
    };


      

    // 4. DYNAMIC HEIGHT CALCULATOR
    function updateNavHeight() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const height = navbar.offsetHeight;
            // This sends the actual height to the CSS variable --nav-height
            document.documentElement.style.setProperty('--nav-height', height + 'px');
        }
    }

    // Run it on load, on scroll, and when the window is resized
    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
});
