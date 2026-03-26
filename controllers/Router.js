export class AppRouter {
    constructor(appInstance) {
        this.app = appInstance;
        this.views = document.querySelectorAll('.view');
        this.navItems = document.querySelectorAll('.nav-item');
        this.currentView = '';
        
        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.navigate(item.dataset.target));
        });
    }

    navigate(viewId) {
        this.views.forEach(v => v.classList.remove('active'));
        this.navItems.forEach(n => n.classList.remove('active'));
        
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');
        
        const activeNav = document.querySelector(`.nav-item[data-target="${viewId}"]`);
        if (activeNav) activeNav.classList.add('active');

        const isAuth = viewId === 'login';
        document.getElementById('mainHeader').style.display = isAuth ? 'none' : 'flex';
        document.getElementById('mainNav').style.display = isAuth ? 'none' : 'flex';

        this.currentView = viewId;
        
        if (viewId === 'profile') this.app.profileController.render();
        if (viewId === 'edit') this.app.editController.mount();
        if (viewId === 'friends') this.app.friendsController.render();
        if (viewId === 'settings') this.app.settingsController.render();
    }
}