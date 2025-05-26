#!/usr/bin/env node

/**
 * Add Blog Headers Script
 * 
 * This script adds proper navigation headers to all language-specific
 * blog pages to match the main blog header functionality.
 */

const fs = require('fs');
const path = require('path');

// Language configurations
const languages = {
    'es': {
        name: 'Spanish',
        blogText: 'Blog',
        homeText: 'Inicio',
        featuresText: 'Características',
        teamText: 'Equipo',
        signUpText: 'Registrarse'
    },
    'fr': {
        name: 'French',
        blogText: 'Blog',
        homeText: 'Accueil',
        featuresText: 'Fonctionnalités',
        teamText: 'Équipe',
        signUpText: 'S\'inscrire'
    },
    'ar': {
        name: 'Arabic',
        blogText: 'المدونة',
        homeText: 'الرئيسية',
        featuresText: 'الميزات',
        teamText: 'الفريق',
        signUpText: 'التسجيل'
    }
};

function generateHeaderHTML(lang) {
    const t = languages[lang];
    
    return `        <!-- Header with Navigation -->
        <header role="banner">
            <nav class="navbar">
                <a href="../index.html" class="logo-link">
                    <div class="nav-logo">
                        <img
                            class="header-logo"
                            src="../../images/divinci_logo_inverted.svg"
                            alt="Divinci Heart Robot logo"
                        />
                    </div>
                    <div class="nav-title">
                        <span class="brand-name">Divinci ™</span>
                        <span class="mobile-hide">&nbsp;- ${t.blogText}</span>
                    </div>
                </a>
                <div class="nav-menu">
                    <a href="../index.html#features">${t.featuresText}</a>
                    <a href="../index.html#team">${t.teamText}</a>
                    <a href="../index.html">${t.homeText}</a>
                    <a href="../index.html#signup" class="signup-link"><span class="signup-button">${t.signUpText}</span></a>
                </div>
            </nav>
        </header>`;
}

function generateHeaderCSS() {
    return `            /* Header styles for blog */
            .navbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 2rem;
                background-color: #16214c;
                position: sticky;
                top: 0;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            .logo-link {
                display: flex;
                align-items: center;
                text-decoration: none;
                color: white;
            }

            .nav-logo {
                margin-right: 1rem;
            }

            .header-logo {
                height: 40px;
                width: auto;
            }

            .nav-title {
                display: flex;
                align-items: center;
            }

            .brand-name {
                font-size: 1.5rem;
                font-weight: 700;
                color: white;
                font-family: 'Sora', sans-serif;
            }

            .nav-menu {
                display: flex;
                align-items: center;
                gap: 2rem;
            }

            .nav-menu a {
                color: white;
                text-decoration: none;
                font-weight: 500;
                transition: color 0.3s ease;
            }

            .nav-menu a:hover {
                color: #5ce2e7;
            }

            .signup-link {
                margin-left: 1rem;
            }

            .signup-button {
                background: linear-gradient(135deg, #5ce2e7, #4dd0d5);
                color: #16214c;
                padding: 0.5rem 1.5rem;
                border-radius: 25px;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .signup-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(92, 226, 231, 0.3);
            }

            @media (max-width: 768px) {
                .navbar {
                    padding: 1rem;
                }
                
                .nav-menu {
                    gap: 1rem;
                }
                
                .mobile-hide {
                    display: none;
                }
                
                .nav-menu a {
                    font-size: 0.9rem;
                }
            }

`;
}

function addHeaderToBlog(lang) {
    const blogPath = path.join(lang, 'blog', 'index.html');
    
    if (!fs.existsSync(blogPath)) {
        console.log(`  ❌ Blog file does not exist: ${blogPath}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(blogPath, 'utf8');
        let modified = false;
        
        // Add header CSS if not present
        if (!content.includes('/* Header styles for blog */')) {
            const cssPattern = /(\s*<style>\s*)/;
            if (cssPattern.test(content)) {
                const headerCSS = generateHeaderCSS();
                content = content.replace(cssPattern, `$1${headerCSS}`);
                modified = true;
                console.log(`  ✅ Added header CSS to ${blogPath}`);
            }
        }
        
        // Add header HTML if not present
        if (!content.includes('class="navbar"')) {
            const headerPattern = /(\s*<!-- Header with Navigation -->\s*<header role="banner">\s*)(.*?)(\s*<\/header>)/s;
            if (headerPattern.test(content)) {
                const headerHTML = generateHeaderHTML(lang);
                content = content.replace(headerPattern, headerHTML);
                modified = true;
                console.log(`  ✅ Added header navigation to ${blogPath}`);
            }
        }
        
        if (modified) {
            fs.writeFileSync(blogPath, content);
            return true;
        } else {
            console.log(`  ℹ️  Header already present in ${blogPath}`);
            return true;
        }
        
    } catch (error) {
        console.error(`  ❌ Error adding header to ${blogPath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🔗 Adding headers to language-specific blogs...\n');

    let totalFixed = 0;
    let totalAttempted = 0;

    Object.keys(languages).forEach(lang => {
        console.log(`\n📝 Adding header to ${languages[lang].name} blog:`);
        totalAttempted++;
        
        const success = addHeaderToBlog(lang);
        if (success) {
            totalFixed++;
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 BLOG HEADER ADDITION SUMMARY:');
    console.log('='.repeat(60));
    
    const successRate = Math.round((totalFixed / totalAttempted) * 100);
    console.log(`📈 Success Rate: ${totalFixed}/${totalAttempted} (${successRate}%)`);
    
    if (totalFixed === totalAttempted) {
        console.log('\n🎉 SUCCESS! All blog headers have been added!');
        console.log('\n✅ What was added:');
        console.log('  • Professional navigation headers with Divinci branding');
        console.log('  • Translated navigation links for each language');
        console.log('  • Consistent styling matching the main website');
        console.log('  • Mobile-responsive design');
        console.log('  • Proper navigation back to main website');
        
        console.log('\n🌍 Blog headers now available in:');
        Object.keys(languages).forEach(lang => {
            console.log(`  • ${languages[lang].name}: /${lang}/blog/`);
        });
        
        console.log('\n📋 Header features:');
        console.log('  • Divinci logo and branding');
        console.log('  • Navigation to Features, Team, Home');
        console.log('  • Sign Up button');
        console.log('  • Sticky header for easy navigation');
        console.log('  • Hover effects and professional styling');
        
    } else {
        console.log('\n⚠️  Some blog headers could not be added. Please check the output above.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { addHeaderToBlog, generateHeaderHTML, generateHeaderCSS };
