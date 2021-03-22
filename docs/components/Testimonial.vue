<template>
  <figure
    class="md:flex md:items-center md:space-x-8 p-4 mt-4 mb-4"
    :class="{ 'md:flex-row-reverse md:space-x-reverse': reversed }"
  >
    <img
      :src="avatarSrc"
      :alt="avatarAlt"
      class="w-32 h-32 mx-auto md:mx-0 rounded-full"
    />
    <div
      class="space-y-4 text-center pt-6 md:pt-0"
      :class="{ 'md:text-left': !reversed, 'md:text-right': reversed }"
    >
      <blockquote class="max-w-[520px]">
        <p class="font-semibold"><slot /></p>
      </blockquote>
      <figcaption class="font-medium">
        <a
          class="text-primary-400 hover:border-b-2 hover:border-primary-400 pb-px"
          target="_blank"
          rel="noopener"
          :href="githubUrl"
        >
          {{ finalDisplayName }}
        </a>
        <div v-if="displayTitle" class="text-gray-400">
          {{ displayTitle }}
        </div>
      </figcaption>
    </div>
  </figure>
</template>

<script>
export default {
  props: {
    /**
     * @description GitHub username
     */
    user: {
      type: String,
      required: true
    },
    /**
     * @description Name to display
     */
    displayName: {
      type: String,
      default: ""
    },
    /**
     * @description An optional title to display
     */
    displayTitle: {
      type: String,
      default: ""
    },
    /**
     * @description An optional title to display
     */
    reversed: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    finalDisplayName() {
      return this.displayName || this.user;
    },
    githubUrl() {
      return `https://github.com/${this.user}`;
    },
    avatarSrc() {
      return `${this.githubUrl}.png`;
    },
    avatarAlt() {
      return `${this.finalDisplayName}'s avatar`;
    }
  }
};
</script>

<style scoped>
blockquote * {
  display: inline;
}

blockquote > p::before {
  content: "“";
}
blockquote > p::after {
  content: "”";
}

blockquote,
blockquote .prose {
  font-size: 1.25rem;
  line-height: 1.75rem;
}
</style>
