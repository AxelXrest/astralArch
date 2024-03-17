#!/bin/bash

# Install Yay
#git clone https://aur.archlinux.org/yay.git
#cd yay
#makepkg -si

# Install AUR packages
yay -S --needed - < packageAUR.txt

# Install Pacman packages
sudo pacman -S --needed - < packagePacman.txt

# Copy configuration files
#cp -r .config/* ~/.config/
#cp .oh-my-zsh .bashrc .p10k.zsh .zprofile .zshrc ~/  # Add more as needed

echo "Installation completed successfully."
