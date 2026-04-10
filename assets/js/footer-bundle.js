/* FOOTER & INTERACTION BUNDLE
   ===========================================================
   ROLE: This file stores the 7-page Site Map and Disclaimer.
   Update links here once to update the whole site.
   ===========================================================
*/

document.addEventListener("DOMContentLoaded", function() {
    // 1. INJECT NAVIGATION
    const navHTML = `
        <div class="nav-logo text-white mr-10 font-bold">DR. SAMEH ELTAYBANI</div>
        <div class="nav-links">
            <a href="index.html" class="nav-item">Home</a>
            <a href="pages/research/research.html" class="nav-item">Research</a>
            <a href="pages/publications/publications.html" class="nav-item">Publications</a>
            <a href="pages/data-analysis/data-analysis.html" class="nav-item">Data Analysis</a>
            <a href="pages/Teaching&Mentorship/teaching.html" class="nav-item">Teaching</a>
            <a href="pages/blog/blog.html" class="nav-item">Blog</a>
            <a href="pages/contact/contact.html" class="nav-item">Contact</a>
        </div>
    `;
    const navPlaceholder = document.querySelector('.navbar');
    if (navPlaceholder) navPlaceholder.innerHTML = navHTML;

    // ... (Keep your existing Footer code here)
});







document.addEventListener("DOMContentLoaded", function() {
    
    const footerHTML = `
    <footer class="site-footer">
        <div class="footer-grid">
            
            <div class="footer-column">
                <h4>Site Map</h4>
                <a href="index.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Home</a>
                <a href="research.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Research</a>
                <a href="publications.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Publications</a>
                <a href="data-analysis.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Data Analysis</a>
                <a href="teaching.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Teaching & Mentorship</a>
                <a href="blog.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Blog</a>
                <a href="contact.html" style="display:block; color:rgba(255,255,255,0.7); margin-bottom:8px; text-decoration:none; font-size:14px;">Contact</a>
            </div>

            <div class="footer-column">
                <h4>Professional Disclaimer</h4>
                <p class="disclaimer-text">
                    The content presented on this website is for informational purposes only. This platform is not sponsored by, endorsed by, or representative of any academic, clinical, or corporate entities I have been affiliated with in the past, currently serve, or may work for in the future. All views, opinions, and data interpretations expressed herein are exclusively my own and do not reflect the official policy or position of any employer or organization.
                </p>
            </div>

        </div>

        <div style="border-top:1px solid rgba(255,255,255,0.1); margin-top:40px; padding-top:20px; text-align:center; font-size:10px; opacity:0.4; letter-spacing:0.2em;">
            © 2026 SAMEH ELTAYBANI. ALL RIGHTS RESERVED.
        </div>

        <a href="#" id="backToTop" style="display:none; text-decoration:none;">↑</a>
    </footer>
    `;

    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        placeholder.innerHTML = footerHTML;
    }

    // Scroll to Top Brain
    const topBtn = document.getElementById("backToTop");
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            topBtn.style.display = "flex";
        } else {
            topBtn.style.display = "none";
        }
    };
});
